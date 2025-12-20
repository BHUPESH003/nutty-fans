import { NextResponse } from 'next/server';

import { AppError, ErrorCode, handleAsyncRoute } from '@/lib/errors/errorHandler';
import { NotificationService } from '@/services/notifications/notificationService';

const notificationService = new NotificationService();

export const notificationController = {
  async list(userId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      const result = await notificationService.list(userId, cursor);
      return NextResponse.json(result);
    });
  },

  async getUnreadCount(userId: string) {
    return handleAsyncRoute(async () => {
      const count = await notificationService.getUnreadCount(userId);
      return NextResponse.json({ count });
    });
  },

  async markAsRead(userId: string, notificationId: string) {
    return handleAsyncRoute(async () => {
      if (!notificationId) {
        throw new AppError(ErrorCode.VALIDATION_MISSING_FIELD, 'Notification ID is required', 400);
      }

      const notification = await notificationService.markAsRead(userId, notificationId);
      return NextResponse.json(notification);
    });
  },

  async markAllAsRead(userId: string) {
    return handleAsyncRoute(async () => {
      const result = await notificationService.markAllAsRead(userId);
      return NextResponse.json(result);
    });
  },
};
