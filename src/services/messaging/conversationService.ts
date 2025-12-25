import { Conversation } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { AppError, RESOURCE_UNAUTHORIZED } from '@/lib/errors/errorHandler';

export class ConversationService {
  async create(userId: string, participantId: string): Promise<Conversation> {
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
        participant1: userId,
        participant2: participantId,
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
              content: true,
              createdAt: true,
            },
          });
          if (msg) {
            lastMessage = {
              content: msg.content,
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
        };
      })
    );

    return { items, nextCursor };
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

    return {
      id: conversation.id,
      otherUser: {
        id: otherUser?.id ?? otherUserId,
        displayName: otherUser?.displayName ?? 'Unknown User',
        username: otherUser?.username ?? 'unknown',
        avatarUrl: otherUser?.avatarUrl ?? null,
      },
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
}
