import { Conversation } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { AppError, RESOURCE_UNAUTHORIZED, VALIDATION_ERROR } from '@/lib/errors/errorHandler';

type ConversationMetadata = {
  mutedBy?: string[];
  favoritedBy?: string[];
  hiddenBy?: string[];
  restrictedBy?: string[];
};

function parseConversationMetadata(raw: unknown): ConversationMetadata {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as ConversationMetadata;
}

function hasUser(metadata: ConversationMetadata, key: keyof ConversationMetadata, userId: string) {
  const arr = metadata[key];
  return Array.isArray(arr) && arr.includes(userId);
}

export class ConversationService {
  async create(userId: string, participantId: string): Promise<Conversation> {
    if (userId === participantId) {
      throw new AppError(VALIDATION_ERROR, 'Cannot create a conversation with yourself', 400);
    }

    const sortedParticipants = [userId, participantId].sort() as [string, string];
    const [participant1, participant2] = sortedParticipants;
    await this.assertMessagingPermission(userId, participantId);

    // Check if conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1: userId, participant2: participantId },
          { participant1: participantId, participant2: userId },
        ],
      },
    });

    if (existing) return existing;

    // Create new conversation
    return prisma.conversation.create({
      data: {
        participant1,
        participant2,
      },
    });
  }

  async list(userId: string, cursor?: string, limit = 20) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1: userId }, { participant2: userId }],
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { lastMessageAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (conversations.length > limit) {
      const nextItem = conversations.pop();
      nextCursor = nextItem?.id;
    }

    // Transform conversations to include user details
    const items = await Promise.all(
      conversations.map(async (conv) => {
        const metadata = parseConversationMetadata(conv.metadata);
        if (hasUser(metadata, 'hiddenBy', userId)) {
          return null;
        }

        const otherUserId = conv.participant1 === userId ? conv.participant2 : conv.participant1;
        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        });

        const unreadCount = conv.participant1 === userId ? conv.unreadCount1 : conv.unreadCount2;

        // Get last message if exists
        let lastMessage: { content: string | null; createdAt: string } | undefined = undefined;
        if (conv.lastMessageId) {
          const msg = await prisma.message.findUnique({
            where: { id: conv.lastMessageId },
            select: {
              senderId: true,
              content: true,
              createdAt: true,
              messageType: true,
              isPaid: true,
              ppvPrice: true,
              media: {
                select: {
                  mediaType: true,
                },
              },
              ppvPurchases: {
                where: { userId },
                select: { id: true },
              },
            },
          });
          if (msg) {
            const isLocked =
              msg.messageType === 'ppv' &&
              msg.isPaid &&
              msg.senderId !== userId &&
              msg.ppvPurchases.length === 0;

            lastMessage = {
              content: isLocked
                ? `Locked message • ${msg.ppvPrice ? `$${Number(msg.ppvPrice).toFixed(2)}` : 'Unlock to view'}`
                : msg.content ||
                  (msg.media.length > 0
                    ? msg.media[0]?.mediaType === 'video'
                      ? 'Sent a video'
                      : msg.media[0]?.mediaType === 'audio'
                        ? 'Sent a voice message'
                        : 'Sent an image'
                    : 'Start chatting...'),
              createdAt: msg.createdAt.toISOString(),
            };
          }
        }

        return {
          id: conv.id,
          otherUser: {
            id: otherUser?.id ?? otherUserId,
            displayName: otherUser?.displayName ?? 'Unknown User',
            username: otherUser?.username ?? 'unknown',
            avatarUrl: otherUser?.avatarUrl ?? null,
          },
          lastMessage,
          unreadCount,
          isMuted: hasUser(metadata, 'mutedBy', userId),
          isFavorite: hasUser(metadata, 'favoritedBy', userId),
        };
      })
    );

    return { items: items.filter((item) => item !== null), nextCursor };
  }

  async get(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return null;

    // Verify participation
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      return null;
    }

    // Get other user details
    const otherUserId =
      conversation.participant1 === userId ? conversation.participant2 : conversation.participant1;
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
      },
    });

    const metadata = parseConversationMetadata(conversation.metadata);

    return {
      id: conversation.id,
      otherUser: {
        id: otherUser?.id ?? otherUserId,
        displayName: otherUser?.displayName ?? 'Unknown User',
        username: otherUser?.username ?? 'unknown',
        avatarUrl: otherUser?.avatarUrl ?? null,
      },
      isMuted: hasUser(metadata, 'mutedBy', userId),
      isFavorite: hasUser(metadata, 'favoritedBy', userId),
      isRestricted: hasUser(metadata, 'restrictedBy', userId),
      isHidden: hasUser(metadata, 'hiddenBy', userId),
      isBlocked: conversation.isBlocked,
      blockedBy: conversation.blockedBy,
    };
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return;

    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new AppError(RESOURCE_UNAUTHORIZED, 'Unauthorized access to conversation', 401);
    }

    const isUser1 = conversation.participant1 === userId;

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        unreadCount1: isUser1 ? 0 : conversation.unreadCount1,
        unreadCount2: isUser1 ? conversation.unreadCount2 : 0,
      },
    });
  }

  private async assertMessagingPermission(userId: string, participantId: string) {
    const users = await prisma.user.findMany({
      where: { id: { in: [userId, participantId] } },
      select: {
        id: true,
        creatorProfile: {
          select: { id: true },
        },
      },
    });

    const viewer = users.find((user) => user.id === userId);
    const participant = users.find((user) => user.id === participantId);

    if (!viewer || !participant) {
      throw new AppError(RESOURCE_UNAUTHORIZED, 'Unauthorized access to conversation', 401);
    }

    if (viewer.creatorProfile || !participant.creatorProfile) {
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        creatorId: participant.creatorProfile.id,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!subscription) {
      throw new AppError(
        RESOURCE_UNAUTHORIZED,
        'You must subscribe to this creator before sending messages',
        403
      );
    }
  }
}
