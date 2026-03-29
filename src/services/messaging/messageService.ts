import { type Prisma, Message, MessageType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import {
  AppError,
  RESOURCE_NOT_FOUND,
  RESOURCE_UNAUTHORIZED,
  RESOURCE_FORBIDDEN,
  VALIDATION_ERROR,
  PAYMENT_INSUFFICIENT_BALANCE,
} from '@/lib/errors/errorHandler';
import { messageEmitter } from '@/lib/realtime/messageEmitter';
import { emitMessageUnlockedToUser, emitNewMessageToUser } from '@/lib/realtime/wsEmitter';
import { redisPub } from '@/lib/redis/redisClient';

export class MessageService {
  async send(
    senderId: string,
    conversationId: string,
    content: string | null,
    mediaIds: string[] = [],
    price?: number,
    clientId?: string,
    metadata?: Record<string, unknown>,
    messageTypeOverride?: MessageType
  ): Promise<Message> {
    // Verify conversation participation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError(RESOURCE_NOT_FOUND, 'Conversation not found', 404);
    }
    if (conversation.participant1 !== senderId && conversation.participant2 !== senderId) {
      throw new AppError(RESOURCE_UNAUTHORIZED, 'Unauthorized access to conversation', 401);
    }
    if (conversation.isBlocked) {
      throw new AppError(RESOURCE_FORBIDDEN, 'Conversation is blocked', 403);
    }

    const recipientId =
      conversation.participant1 === senderId
        ? conversation.participant2
        : conversation.participant1;
    await this.assertMessagingPermission(senderId, recipientId);

    // Determine message type
    let messageType: MessageType = messageTypeOverride ?? 'text';
    if (!messageTypeOverride) {
      if (mediaIds.length > 0) messageType = 'media';
      if (price && price > 0) messageType = 'ppv';
    }

    const isPpv = messageType === 'ppv';
    const isTip = messageType === 'tip';
    const isPaid = isTip ? true : isPpv ? (price ? price > 0 : false) : false;
    const ppvPrice = isPpv ? (price ?? null) : null;

    let message: Message | null = null;
    let isNew = false;

    // Idempotency: if client sends `clientId`, avoid duplicates.
    if (clientId) {
      const existing = await prisma.message.findUnique({
        where: { clientId },
        include: { media: true },
      });

      if (existing) {
        // Ensure the existing message belongs to this conversation + sender.
        if (existing.conversationId !== conversationId || existing.senderId !== senderId) {
          throw new AppError(VALIDATION_ERROR, 'Invalid clientId for this conversation', 400);
        }
        message = existing;
      } else {
        isNew = true;
      }
    } else {
      isNew = true;
    }

    // Create message (only when not deduped)
    if (isNew) {
      const createdMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
          messageType,
          type: messageType,
          clientId: clientId ?? null,
          ppvPrice,
          isPaid,
          metadata: (metadata ?? {}) as unknown as Prisma.InputJsonValue,
        },
      });

      if (mediaIds.length > 0) {
        await prisma.$transaction(
          mediaIds.map((mediaId, index) =>
            prisma.media.update({
              where: { id: mediaId },
              data: {
                messageId: createdMessage.id,
                sortOrder: index,
              },
            })
          )
        );
      }

      message = await prisma.message.findUnique({
        where: { id: createdMessage.id },
        include: {
          media: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }

    if (!message) {
      throw new AppError(VALIDATION_ERROR, 'Failed to create or resolve message', 500);
    }

    // Update conversation lastMessage
    const isUser1 = conversation.participant1 === senderId;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
        ...(isNew
          ? {
              unreadCount1: isUser1 ? conversation.unreadCount1 : { increment: 1 },
              unreadCount2: isUser1 ? { increment: 1 } : conversation.unreadCount2,
            }
          : {}),
      },
    });

    // Phase 10: Redis unread counter cache (best-effort).
    if (isNew) {
      const receiverId = isUser1 ? conversation.participant2 : conversation.participant1;
      const key = `chat_unread:${receiverId}:${conversationId}`;
      void redisPub
        .incr(key)
        .then(() => redisPub.expire(key, 60 * 60 * 24 * 7))
        .catch(() => {
          // Ignore cache failures.
        });
    }

    // Emit real-time event for new message (legacy SSE/conversation list updates)
    messageEmitter.emit(conversationId, { type: 'message', data: message });

    // Phase 1: publish WebSocket event (masked per-recipient)
    try {
      const participantIds = [conversation.participant1, conversation.participant2];

      for (const participantId of participantIds) {
        // For PPV, recipients who haven't purchased should see locked content.
        const isRecipientSender = message.senderId === participantId;
        let isPurchased = false;
        if (message.messageType === 'ppv' && message.isPaid && !isRecipientSender) {
          const purchase = await prisma.ppvPurchase.findUnique({
            where: {
              userId_messageId: {
                userId: participantId,
                messageId: message.id,
              },
            },
          });
          isPurchased = Boolean(purchase);
        }

        const isLocked =
          message.messageType === 'ppv' && message.isPaid && !isRecipientSender && !isPurchased;

        const messageWithMedia = message as unknown as { media?: unknown[] };

        const dto = {
          id: message.id,
          clientId: message.clientId,
          senderId: message.senderId,
          conversationId: message.conversationId,
          createdAt: message.createdAt,
          messageType: message.messageType,
          ppvPrice: message.ppvPrice,
          isPaid: message.isPaid,
          isLocked,
          isRead: message.isRead,
          status: message.status,
          deliveredAt: message.deliveredAt,
          readAt: message.readAt,
          content: isLocked ? null : message.content,
          media: isLocked ? [] : (messageWithMedia.media ?? []),
          metadata: message.metadata,
          reactions: [],
          broadcastPurchases: [],
        };

        await emitNewMessageToUser(participantId, conversationId, dto);
      }
    } catch (err) {
      console.error('[WS] Failed to emit message:new:', err);
    }

    // Only emit list updates when the message was newly created.
    if (isNew) {
      messageEmitter.emit(`conversations:${conversation.participant1}`, {
        type: 'conversation_updated',
        conversationId,
      });
      messageEmitter.emit(`conversations:${conversation.participant2}`, {
        type: 'conversation_updated',
        conversationId,
      });
    }

    return message;
  }

  private async assertMessagingPermission(senderId: string, recipientId: string) {
    const users = await prisma.user.findMany({
      where: { id: { in: [senderId, recipientId] } },
      select: {
        id: true,
        creatorProfile: {
          select: { id: true },
        },
      },
    });

    const sender = users.find((user) => user.id === senderId);
    const recipient = users.find((user) => user.id === recipientId);

    if (!sender || !recipient) {
      throw new AppError(RESOURCE_UNAUTHORIZED, 'Unauthorized access to conversation', 401);
    }

    if (sender.creatorProfile || !recipient.creatorProfile) {
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: senderId,
        creatorId: recipient.creatorProfile.id,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!subscription) {
      throw new AppError(
        RESOURCE_FORBIDDEN,
        'Subscribe to this creator before sending messages',
        403
      );
    }
  }

  async list(userId: string, conversationId: string, cursor?: string, limit = 50) {
    // Verify participation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new AppError(RESOURCE_NOT_FOUND, 'Conversation not found', 404);
    }
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new AppError(RESOURCE_UNAUTHORIZED, 'Unauthorized access to conversation', 401);
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        ppvPurchases: {
          where: { userId },
        },
        reactions: {
          select: {
            emoji: true,
            userId: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem?.id;
    }

    // Process messages (mask paid content)
    const items = messages.map((msg) => {
      const isSender = msg.senderId === userId;
      const isPurchased = msg.ppvPurchases.length > 0;
      const isLocked = msg.messageType === 'ppv' && msg.isPaid && !isSender && !isPurchased;

      return {
        id: msg.id,
        clientId: msg.clientId,
        senderId: msg.senderId,
        content: isLocked ? null : msg.content,
        messageType: msg.messageType,
        metadata: msg.metadata as unknown as Record<string, unknown>,
        status: msg.status,
        deliveredAt: msg.deliveredAt,
        readAt: msg.readAt,
        ppvPrice: msg.ppvPrice,
        isPaid: msg.isPaid,
        isLocked,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
        media: isLocked ? [] : msg.media, // Hide media if locked
        reactions: msg.reactions.map((r) => ({ emoji: r.emoji, userId: r.userId })),
      };
    });

    return { items, nextCursor };
  }

  async unlock(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new Error('Message not found');
    if (!message.isPaid) {
      throw new AppError(VALIDATION_ERROR, 'Message is not paid content', 400);
    }
    if (!message.ppvPrice || message.ppvPrice.lessThanOrEqualTo(0)) {
      throw new AppError(VALIDATION_ERROR, 'Invalid message price', 400);
    }

    // Phase 4/5: PPV broadcasts attach `metadata.broadcastId` so we can attribute purchases.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const broadcastId = (message.metadata as any)?.broadcastId as string | undefined;

    // Check if already purchased
    const existingPurchase = await prisma.ppvPurchase.findUnique({
      where: {
        userId_messageId: {
          userId,
          messageId,
        },
      },
    });

    if (existingPurchase) return { success: true, alreadyPurchased: true };

    // Check wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new AppError(RESOURCE_NOT_FOUND, 'User not found', 404);
    }

    if (user.walletBalance.lessThan(message.ppvPrice)) {
      throw new AppError(
        PAYMENT_INSUFFICIENT_BALANCE,
        'Insufficient balance. Please add funds to continue.',
        402
      );
    }

    // Process transaction (atomic)
    return prisma.$transaction(async (tx) => {
      // Deduct from user
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: message.ppvPrice! } },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          creatorId: message.senderId, // Assuming sender is creator
          transactionType: 'message',
          amount: message.ppvPrice!,
          status: 'completed',
          description: `Unlock message from ${message.senderId}`,
        },
      });

      // Create purchase record
      await tx.ppvPurchase.create({
        data: {
          userId,
          messageId,
          transactionId: transaction.id,
          pricePaid: message.ppvPrice!,
        },
      });

      // If this unlock is from a broadcast PPV message, attribute the purchase.
      if (broadcastId) {
        await tx.broadcastPurchase.upsert({
          where: {
            broadcastId_fanId: {
              broadcastId,
              fanId: userId,
            },
          },
          update: {},
          create: {
            broadcastId,
            fanId: userId,
            amount: message.ppvPrice!,
            messageId,
            // transactionId is not stored on BroadcastPurchase; analytics will use BroadcastPurchase row + Amount.
          },
        });

        await tx.broadcast.update({
          where: { id: broadcastId },
          data: {
            purchasedCount: { increment: 1 },
            revenueTotal: { increment: message.ppvPrice! },
          },
        });
      }

      // Credit creator (simplified, usually involves commission)
      // TODO: Use PayoutService/TransactionService for proper commission handling
      await tx.creatorProfile.update({
        where: { userId: message.senderId },
        data: { totalEarnings: { increment: message.ppvPrice! } },
      });

      // Get the updated message with media
      const unlockedMessage = await tx.message.findUnique({
        where: { id: messageId },
        include: {
          media: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      // Emit event for message unlock (so recipients can see unlocked content)
      if (unlockedMessage) {
        messageEmitter.emit(message.conversationId, {
          type: 'messageUnlocked',
          data: {
            id: unlockedMessage.id,
            content: unlockedMessage.content,
            media: unlockedMessage.media,
            isLocked: false,
          },
        });

        // Phase 1: publish WebSocket unlock event (target unlocker only).
        try {
          void emitMessageUnlockedToUser(userId, message.conversationId, {
            id: unlockedMessage.id,
            content: unlockedMessage.content,
            media: unlockedMessage.media,
            isLocked: false,
            messageType: unlockedMessage.messageType,
            ppvPrice: unlockedMessage.ppvPrice,
            metadata: unlockedMessage.metadata,
          });
        } catch (err) {
          console.error('[WS] Failed to emit message:unlocked:', err);
        }
      }

      return { success: true };
    });
  }
}
