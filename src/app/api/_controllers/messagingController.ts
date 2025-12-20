import { successResponse } from '@/lib/api/response';
import {
  AppError,
  handleAsyncRoute,
  VALIDATION_MISSING_FIELD,
  RESOURCE_NOT_FOUND,
  VALIDATION_ERROR,
} from '@/lib/errors/errorHandler';
import { ConversationService } from '@/services/messaging/conversationService';
import { MessageService } from '@/services/messaging/messageService';

const conversationService = new ConversationService();
const messageService = new MessageService();

export const messagingController = {
  // Conversations
  async createConversation(userId: string, participantId: string) {
    return handleAsyncRoute(async () => {
      if (!participantId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Participant ID is required', 400);
      }

      const conversation = await conversationService.create(userId, participantId);
      return successResponse(conversation);
    });
  },

  async listConversations(userId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      const result = await conversationService.list(userId, cursor);
      return successResponse(result);
    });
  },

  async getConversation(userId: string, conversationId: string) {
    return handleAsyncRoute(async () => {
      if (!conversationId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Conversation ID is required', 400);
      }

      const conversation = await conversationService.get(userId, conversationId);
      if (!conversation) {
        throw new AppError(RESOURCE_NOT_FOUND, 'Conversation not found', 404);
      }
      return successResponse(conversation);
    });
  },

  async markConversationRead(userId: string, conversationId: string) {
    return handleAsyncRoute(async () => {
      if (!conversationId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Conversation ID is required', 400);
      }

      await conversationService.markRead(userId, conversationId);
      return successResponse({ success: true });
    });
  },

  // Messages
  async sendMessage(
    userId: string,
    conversationId: string,
    body: { content?: string; mediaId?: string; price?: number }
  ) {
    return handleAsyncRoute(async () => {
      if (!conversationId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Conversation ID is required', 400);
      }

      const { content, mediaId, price } = body;

      // Validate that at least content or mediaId is provided
      if (!content && !mediaId) {
        throw new AppError(VALIDATION_ERROR, 'Message content or media is required', 400);
      }

      const message = await messageService.send(
        userId,
        conversationId,
        content ?? null,
        mediaId,
        price
      );
      return successResponse(message);
    });
  },

  async listMessages(userId: string, conversationId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      if (!conversationId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Conversation ID is required', 400);
      }

      const result = await messageService.list(userId, conversationId, cursor);
      return successResponse(result);
    });
  },

  async unlockMessage(userId: string, messageId: string) {
    return handleAsyncRoute(async () => {
      if (!messageId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Message ID is required', 400);
      }

      const result = await messageService.unlock(userId, messageId);
      return successResponse(result);
    });
  },
};
