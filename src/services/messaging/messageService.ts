import { Message, MessageType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export class MessageService {
  async send(
    senderId: string,
    conversationId: string,
    content: string | null,
    mediaId?: string,
    price?: number
  ): Promise<Message> {
    // Verify conversation participation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error('Conversation not found');
    if (conversation.participant1 !== senderId && conversation.participant2 !== senderId) {
      throw new Error('Unauthorized');
    }
    if (conversation.isBlocked) throw new Error('Conversation is blocked');

    // Determine message type
    let messageType: MessageType = 'text';
    if (mediaId) messageType = 'media';
    if (price && price > 0) messageType = 'ppv';

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        messageType,
        ppvPrice: price,
        isPaid: price ? price > 0 : false,
        media: mediaId ? { connect: { id: mediaId } } : undefined,
      },
      include: {
        media: true,
      },
    });

    // Update conversation lastMessage
    const isUser1 = conversation.participant1 === senderId;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageId: message.id,
        lastMessageAt: message.createdAt,
        unreadCount1: isUser1 ? conversation.unreadCount1 : { increment: 1 },
        unreadCount2: isUser1 ? { increment: 1 } : conversation.unreadCount2,
      },
    });

    return message;
  }

  async list(userId: string, conversationId: string, cursor?: string, limit = 50) {
    // Verify participation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) throw new Error('Conversation not found');
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new Error('Unauthorized');
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        media: true,
        ppvPurchases: {
          where: { userId },
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
      const isLocked = msg.isPaid && !isSender && !isPurchased;

      return {
        id: msg.id,
        senderId: msg.senderId,
        content: isLocked ? null : msg.content,
        messageType: msg.messageType,
        ppvPrice: msg.ppvPrice,
        isPaid: msg.isPaid,
        isLocked,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
        media: isLocked ? [] : msg.media, // Hide media if locked
      };
    });

    return { items, nextCursor };
  }

  async unlock(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new Error('Message not found');
    if (!message.isPaid) throw new Error('Message is not paid content');
    if (!message.ppvPrice) throw new Error('Invalid price');

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

    if (!user || user.walletBalance.lessThan(message.ppvPrice)) {
      throw new Error('Insufficient balance');
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

      // Credit creator (simplified, usually involves commission)
      // TODO: Use PayoutService/TransactionService for proper commission handling
      await tx.creatorProfile.update({
        where: { userId: message.senderId },
        data: { totalEarnings: { increment: message.ppvPrice! } },
      });

      return { success: true };
    });
  }
}
