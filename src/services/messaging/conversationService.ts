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
      include: {
        lastMessage: true,
      },
    });

    let nextCursor: string | undefined = undefined;
    if (conversations.length > limit) {
      const nextItem = conversations.pop();
      nextCursor = nextItem?.id;
    }

    return { conversations, nextCursor };
  }

  async get(userId: string, conversationId: string): Promise<Conversation | null> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return null;

    // Verify participation
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      return null;
    }

    return conversation;
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
