import { Conversation } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { AppError, ErrorCode } from '@/lib/errors/errorHandler';

export class ConversationService {
  async create(userId: string, participantId: string): Promise<Conversation> {
    // Ensure smaller ID is participant1 to prevent duplicates
    const [p1, p2] = [userId, participantId].sort() as [string, string];

    // Check if conversation exists
    const existing = await prisma.conversation.findUnique({
      where: {
        participant1_participant2: {
          participant1: p1,
          participant2: p2,
        },
      },
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        participant1: p1,
        participant2: p2,
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
      include: {
        user1: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (conversations.length > limit) {
      const nextItem = conversations.pop();
      nextCursor = nextItem?.id;
    }

    // Format for frontend
    const items = conversations.map((c) => {
      const otherUser = c.participant1 === userId ? c.user2 : c.user1;
      const unreadCount = c.participant1 === userId ? c.unreadCount1 : c.unreadCount2;
      return {
        id: c.id,
        otherUser,
        lastMessageAt: c.lastMessageAt,
        unreadCount,
        isBlocked: c.isBlocked,
      };
    });

    return { items, nextCursor };
  }

  async get(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        user2: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!conversation) return null;

    // Verify participation
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new AppError(
        ErrorCode.RESOURCE_UNAUTHORIZED,
        'Unauthorized access to conversation',
        401
      );
    }

    const otherUser =
      conversation.participant1 === userId ? conversation.user2 : conversation.user1;
    const unreadCount =
      conversation.participant1 === userId ? conversation.unreadCount1 : conversation.unreadCount2;

    return {
      id: conversation.id,
      otherUser,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount,
      isBlocked: conversation.isBlocked,
      blockedBy: conversation.blockedBy,
    };
  }

  async markRead(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return;

    if (conversation.participant1 === userId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount1: 0 },
      });
    } else if (conversation.participant2 === userId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCount2: 0 },
      });
    }
  }
}
