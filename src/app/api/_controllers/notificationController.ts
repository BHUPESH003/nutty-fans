import { successResponse } from '@/lib/api/response';
import { AppError, handleAsyncRoute, VALIDATION_MISSING_FIELD } from '@/lib/errors/errorHandler';
import { NotificationService } from '@/services/notifications/notificationService';

const notificationService = new NotificationService();

export const notificationController = {
  async list(userId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      const result = await notificationService.list(userId, cursor);
      return successResponse(result);
    });
  },

  async getUnreadCount(userId: string) {
    return handleAsyncRoute(async () => {
      const count = await notificationService.getUnreadCount(userId);
      return successResponse({ count });
    });
  },

  async markAsRead(userId: string, notificationId: string) {
    return handleAsyncRoute(async () => {
      if (!notificationId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Notification ID is required', 400);
      }

      const notification = await notificationService.markAsRead(userId, notificationId);
      return successResponse(notification);
    });
  },

  async markAllAsRead(userId: string) {
    return handleAsyncRoute(async () => {
      const result = await notificationService.markAllAsRead(userId);
      return successResponse(result);
    });
  },
};
