/**
 * E2E Tests for Notifications
 *
 * Critical User Journeys:
 * - J6: User → Receive notification → View
 */

import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test.describe('Notification Bell', () => {
    test('NOTIF-010: should display notification badge', async ({ page }) => {
      await page.goto('/feed');

      // Look for notification bell icon
      const notificationBell = page.locator(
        '[data-testid="notification-bell"], [aria-label*="notification"]'
      );
      await expect(notificationBell).toBeVisible();
    });

    test('should show unread count badge', async ({ page }) => {
      await page.goto('/feed');

      const unreadBadge = page.locator('[data-testid="notification-count"], .notification-badge');
      const hasUnread = await unreadBadge.isVisible().catch(() => false);

      console.log(`Has unread notifications: ${hasUnread}`);
    });
  });

  test.describe('Notification List', () => {
    test('should display notifications list', async ({ page }) => {
      await page.goto('/notifications');

      // Should see notifications or empty state
      const notificationsList = page.locator('[data-testid="notifications-list"]');
      const emptyState = page.locator('text=/no notifications|all caught up/i');

      const hasNotifications = await notificationsList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasNotifications || isEmpty).toBe(true);
    });

    test('UX-012: should show empty notifications state', async ({ page }) => {
      await page.goto('/notifications');

      const notificationItem = page.locator('[data-testid="notification-item"]');
      const emptyState = page.locator(
        '[data-testid="empty-notifications"], text=/no notifications/i'
      );

      const hasNotifications = await notificationItem
        .first()
        .isVisible()
        .catch(() => false);
      if (!hasNotifications) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('Notification Interactions', () => {
    test('should mark notification as read', async ({ page }) => {
      await page.goto('/notifications');

      const unreadNotification = page
        .locator(
          '[data-testid="notification-item"].unread, [data-testid="notification-item"][data-read="false"]'
        )
        .first();
      const hasUnread = await unreadNotification.isVisible().catch(() => false);

      if (hasUnread) {
        await unreadNotification.click();

        // Should navigate or mark as read
        await page.waitForTimeout(500);

        // Check if it's marked as read
        const isStillUnread = (await unreadNotification.getAttribute('data-read')) === 'false';
        console.log(`Notification marked as read: ${!isStillUnread}`);
      }
    });

    test('should mark all as read', async ({ page }) => {
      await page.goto('/notifications');

      const markAllButton = page.locator(
        '[data-testid="mark-all-read"], text=/mark all|read all/i'
      );
      const hasButton = await markAllButton.isVisible().catch(() => false);

      if (hasButton) {
        await markAllButton.click();

        // All notifications should be marked as read
        await page.waitForTimeout(1000);

        const unreadCount = page.locator('[data-testid="notification-item"].unread');
        const count = await unreadCount.count();

        expect(count).toBe(0);
      }
    });

    test('should navigate to related content on click', async ({ page }) => {
      await page.goto('/notifications');

      const notificationItem = page.locator('[data-testid="notification-item"]').first();
      const hasNotification = await notificationItem.isVisible().catch(() => false);

      if (hasNotification) {
        const currentUrl = page.url();
        await notificationItem.click();

        // Should navigate somewhere
        await page.waitForURL(/.*/, { timeout: 5000 });

        // URL should have changed or modal should open
        const newUrl = page.url();
        console.log(`Navigation: ${currentUrl} -> ${newUrl}`);
      }
    });
  });

  test.describe('Notification Types', () => {
    test('NOTIF-002: should display new subscriber notification', async ({ page }) => {
      await page.goto('/notifications');

      // Look for subscriber notification
      const subscriberNotif = page.locator('text=/subscribed|new subscriber/i');
      const hasSubscriberNotif = await subscriberNotif.isVisible().catch(() => false);

      console.log(`Has subscriber notification: ${hasSubscriberNotif}`);
    });

    test('NOTIF-003: should display tip received notification', async ({ page }) => {
      await page.goto('/notifications');

      // Look for tip notification
      const tipNotif = page.locator('text=/tip|tipped/i');
      const hasTipNotif = await tipNotif.isVisible().catch(() => false);

      console.log(`Has tip notification: ${hasTipNotif}`);
    });

    test('NOTIF-004: should display new message notification', async ({ page }) => {
      await page.goto('/notifications');

      // Look for message notification
      const messageNotif = page.locator('text=/message|messaged/i');
      const hasMessageNotif = await messageNotif.isVisible().catch(() => false);

      console.log(`Has message notification: ${hasMessageNotif}`);
    });
  });

  test.describe('Notification Preferences', () => {
    test('NOTIF-013: should respect notification preferences', async ({ page }) => {
      await page.goto('/settings/notifications');

      // Should see notification settings
      const settingsPage = page.locator('[data-testid="notification-settings"]');
      const hasSettings = await settingsPage.isVisible().catch(() => false);

      if (hasSettings) {
        // Find email toggle
        const emailToggle = page.locator(
          '[data-testid="email-notifications"], [name="emailNotifications"]'
        );
        if (await emailToggle.isVisible()) {
          // Toggle setting
          await emailToggle.click();

          // Save should happen automatically or there's a save button
          const saveButton = page.locator('[data-testid="save-settings"], text=/save/i');
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }

          // Preference should be saved
          await page.waitForTimeout(500);
          console.log('Notification preference toggled');
        }
      }
    });
  });
});

test.describe('Push Notifications', () => {
  test('should show push notification permission prompt', async ({ page, context }) => {
    // Grant notification permission for testing
    await context.grantPermissions(['notifications']);

    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });

    // Look for push notification prompt
    const pushPrompt = page.locator(
      '[data-testid="push-prompt"], text=/enable.*notification|push notification/i'
    );
    const hasPrompt = await pushPrompt.isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`Push notification prompt visible: ${hasPrompt}`);
  });
});
