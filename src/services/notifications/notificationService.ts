import { prisma } from '@/lib/db/prisma';
import { emitNotificationCountUpdate } from '@/lib/realtime/wsEmitter';
import { NotificationRepository } from '@/repositories/notificationRepository';
import { EmailService } from '@/services/auth/emailService';

import { pushNotificationService } from './pushNotificationService';

const emailService = new EmailService();

export type NotificationType =
  | 'new_post'
  | 'new_subscriber'
  | 'subscription_expiring'
  | 'payment_received'
  | 'new_message'
  | 'kyc_approved'
  | 'payout_sent'
  | 'tip_received'
  | 'comment_reply'
  | 'like_received';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
}

export class NotificationService {
  private repository: NotificationRepository;

  constructor() {
    this.repository = new NotificationRepository();
  }

  async create(params: CreateNotificationParams) {
    const notification = await this.repository.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
      actionUrl: params.actionUrl,
    });

    // Send email notification if user has email notifications enabled
    await this.sendEmailNotificationIfEnabled(
      params.userId,
      params.title,
      params.body ?? '',
      params.actionUrl
    );

    // Send push notification if user has push notifications enabled
    await this.sendPushNotificationIfEnabled(params.userId, {
      title: params.title,
      body: params.body ?? '',
      actionUrl: params.actionUrl,
      data: params.data as Record<string, string> | undefined,
    });

    // Push real-time notification count update via WebSocket.
    try {
      await emitNotificationCountUpdate(params.userId);
    } catch (err) {
      console.error('[WS] Failed to emit notification:count:', err);
    }

    return notification;
  }

  /**
   * Send email notification if user has email notifications enabled
   */
  private async sendEmailNotificationIfEnabled(
    userId: string,
    subject: string,
    body: string,
    actionUrl?: string
  ): Promise<void> {
    try {
      // Get user email and notification preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          notificationSettings: {
            select: {
              emailNotifications: true,
            },
          },
        },
      });

      if (!user || !user.email) {
        return;
      }

      // Check if email notifications are enabled (default to true if settings don't exist)
      const emailEnabled = user.notificationSettings?.emailNotifications ?? true;

      if (!emailEnabled) {
        return;
      }

      // Build email HTML
      const actionButton = actionUrl
        ? `<p style="text-align: center; margin: 30px 0;">
             <a href="${process.env['NEXT_PUBLIC_APP_URL'] ?? ''}${actionUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View</a>
           </p>`
        : '';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6366f1;">${subject}</h1>
            <p>${body}</p>
            ${actionButton}
            <p style="margin-top: 30px; color: #666; font-size: 14px;">You can manage your notification preferences in your account settings.</p>
          </body>
        </html>
      `;

      await emailService.sendNotificationEmail({
        email: user.email,
        subject,
        html,
        text: body,
      });
    } catch (error) {
      // Log error but don't throw - email failures shouldn't break notifications
      console.error('Failed to send email notification:', error);
    }
  }

  /**
   * Send push notification if user has push notifications enabled
   */
  private async sendPushNotificationIfEnabled(
    userId: string,
    payload: { title: string; body: string; actionUrl?: string; data?: Record<string, string> }
  ): Promise<void> {
    try {
      await pushNotificationService.sendToUser(userId, {
        title: payload.title,
        body: payload.body,
        actionUrl: payload.actionUrl,
        data: payload.data,
      });
    } catch (error) {
      // Log error but don't throw - push failures shouldn't break notifications
      console.error('Failed to send push notification:', error);
    }
  }

  async list(userId: string, cursor?: string) {
    return this.repository.list(userId, cursor);
  }

  async getUnreadCount(userId: string) {
    return this.repository.getUnreadCount(userId);
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.repository.markAsRead(userId, notificationId);
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId);
  }

  // Helper methods for common notification types
  async notifyNewPost(userId: string, creatorId: string, postId: string, creatorName: string) {
    return this.create({
      userId,
      type: 'new_post',
      title: `New post from ${creatorName}`,
      body: `${creatorName} just posted new content`,
      data: { creatorId, postId },
      actionUrl: `/post/${postId}`,
    });
  }

  async notifyNewSubscriber(creatorId: string, subscriberId: string, subscriberName: string) {
    return this.create({
      userId: creatorId,
      type: 'new_subscriber',
      title: 'New subscriber',
      body: `${subscriberName} subscribed to you`,
      data: { subscriberId },
      actionUrl: `/u/${subscriberId}`,
    });
  }

  async notifyNewMessage(
    userId: string,
    senderId: string,
    senderName: string,
    conversationId: string
  ) {
    return this.create({
      userId,
      type: 'new_message',
      title: `New message from ${senderName}`,
      body: `You have a new message`,
      data: { senderId, conversationId },
      actionUrl: `/messages/${conversationId}`,
    });
  }

  async notifyPaymentReceived(
    userId: string,
    amount: number,
    type: 'tip' | 'ppv' | 'subscription'
  ) {
    return this.create({
      userId,
      type: 'payment_received',
      title: 'Payment received',
      body: `You received $${amount.toFixed(2)} from ${type}`,
      data: { amount, type },
      actionUrl: '/creator/transactions',
    });
  }

  async notifyTipReceived(creatorId: string, amount: number, tipperName: string) {
    return this.create({
      userId: creatorId,
      type: 'tip_received',
      title: 'New tip',
      body: `${tipperName} sent you $${amount.toFixed(2)}`,
      data: { amount },
      actionUrl: '/creator/earnings',
    });
  }
}
