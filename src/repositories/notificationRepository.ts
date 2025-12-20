import { Notification, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export class NotificationRepository {
  async create(data: {
    userId: string;
    type: string;
    title: string;
    body?: string | null;
    data?: Record<string, unknown>;
    actionUrl?: string | null;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: (data.data || {}) as Prisma.InputJsonValue,
        actionUrl: data.actionUrl,
      },
    });
  }

  async list(userId: string, cursor?: string, limit = 20) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem?.id;
    }

    return { items: notifications, nextCursor };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensures user can only mark their own notifications as read
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }
}
