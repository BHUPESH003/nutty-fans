/**
 * Push Notification Service
 *
 * Handles push notifications using Web Push API
 */

import webpush from 'web-push';

import { prisma } from '@/lib/db/prisma';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env['VAPID_PUBLIC_KEY'] ?? '';
const vapidPrivateKey = process.env['VAPID_PRIVATE_KEY'] ?? '';
const vapidSubject = process.env['VAPID_SUBJECT'] ?? 'mailto:support@nuttyfans.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, string>;
  actionUrl?: string;
}

export class PushNotificationService {
  /**
   * Register push subscription for a user
   */
  async registerSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint,
        },
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Unregister push subscription
   */
  async unregisterSubscription(userId: string, endpoint: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });
  }

  /**
   * Unregister all subscriptions for a user
   */
  async unregisterAllSubscriptions(userId: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({
      where: { userId },
    });
  }

  /**
   * Send push notification to a user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      // Get user's push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        return false; // No subscriptions
      }

      // Check if user has push notifications enabled
      const userSettings = await prisma.userNotificationSettings.findUnique({
        where: { userId },
        select: { pushNotifications: true },
      });

      if (userSettings && !userSettings.pushNotifications) {
        return false; // User disabled notifications
      }

      // Send to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          this.sendToSubscription(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
        )
      );

      // Remove failed subscriptions
      const failedSubscriptions = subscriptions.filter(
        (_, index) => results[index]?.status === 'rejected'
      );

      if (failedSubscriptions.length > 0) {
        await prisma.pushSubscription.deleteMany({
          where: {
            userId,
            endpoint: { in: failedSubscriptions.map((s) => s.endpoint) },
          },
        });
      }

      return results.some((r) => r.status === 'fulfilled');
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  private async sendToSubscription(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: PushNotificationPayload
  ): Promise<void> {
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      image: payload.image,
      data: {
        ...payload.data,
        actionUrl: payload.actionUrl || '/',
      },
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      notificationPayload
    );
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<number> {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendToUser(userId, payload))
    );

    return results.filter((r) => r.status === 'fulfilled' && r.value === true).length;
  }

  /**
   * Get VAPID public key for client
   */
  getVapidPublicKey(): string {
    return vapidPublicKey;
  }
}

export const pushNotificationService = new PushNotificationService();
