import { NextResponse } from 'next/server';

import { ConversationService } from '@/services/messaging/conversationService';
import { MessageService } from '@/services/messaging/messageService';

const conversationService = new ConversationService();
const messageService = new MessageService();

export const messagingController = {
  // Conversations
  async createConversation(userId: string, participantId: string) {
    try {
      const conversation = await conversationService.create(userId, participantId);
      return NextResponse.json(conversation);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
  },

  async listConversations(userId: string, cursor?: string) {
    try {
      const result = await conversationService.list(userId, cursor);
      return NextResponse.json(result);
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
    }
  },

  async getConversation(userId: string, conversationId: string) {
    try {
      const conversation = await conversationService.get(userId, conversationId);
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      return NextResponse.json(conversation);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to get conversation' }, { status: 500 });
    }
  },

  async markConversationRead(userId: string, conversationId: string) {
    try {
      await conversationService.markRead(userId, conversationId);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
    }
  },

  // Messages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async sendMessage(userId: string, conversationId: string, body: any) {
    try {
      const { content, mediaId, price } = body;
      const message = await messageService.send(userId, conversationId, content, mediaId, price);
      return NextResponse.json(message);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
  },

  async listMessages(userId: string, conversationId: string, cursor?: string) {
    try {
      const result = await messageService.list(userId, conversationId, cursor);
      return NextResponse.json(result);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to list messages' }, { status: 500 });
    }
  },

  async unlockMessage(userId: string, messageId: string) {
    try {
      const result = await messageService.unlock(userId, messageId);
      return NextResponse.json(result);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message === 'Insufficient balance') {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 402 });
      }
      return NextResponse.json({ error: 'Failed to unlock message' }, { status: 500 });
    }
  },
};
