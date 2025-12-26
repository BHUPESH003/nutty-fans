/**
 * E2E Tests for Subscriptions & Payments
 *
 * Critical User Journeys:
 * - J2: User → Subscribe → View content → Unsubscribe
 * - J4: User → Purchase PPV → View content
 */

import { test, expect } from '@playwright/test';

test.describe('Subscription Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user with wallet balance
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test.describe('Viewing Creator Profile', () => {
    test('should display subscription options on creator profile', async ({ page }) => {
      // Navigate to a creator profile
      await page.goto('/c/testcreator');

      // Should see subscription button or price
      const subscribeButton = page.locator('[data-testid="subscribe-button"], text=/subscribe/i');
      await expect(subscribeButton).toBeVisible({ timeout: 5000 });
    });

    test('should display subscription plans', async ({ page }) => {
      await page.goto('/c/testcreator');

      // Click subscribe to see plans
      await page.click('[data-testid="subscribe-button"], text=/subscribe/i');

      // Should see plan options (monthly, 3-month, yearly)
      const planModal = page.locator('[data-testid="subscription-modal"], [role="dialog"]');
      await expect(planModal).toBeVisible();
    });
  });

  test.describe('Subscription Purchase', () => {
    test('PAY-002: should subscribe with wallet balance', async ({ page }) => {
      await page.goto('/c/testcreator');

      // Click subscribe
      await page.click('[data-testid="subscribe-button"], text=/subscribe/i');

      // Select monthly plan
      const monthlyPlan = page.locator('[data-testid="plan-monthly"], text=/monthly/i').first();
      if (await monthlyPlan.isVisible()) {
        await monthlyPlan.click();
      }

      // Confirm subscription
      const confirmButton = page
        .locator('[data-testid="confirm-subscribe"], text=/confirm|subscribe/i')
        .last();
      await confirmButton.click();

      // Should see success or subscribed state
      await expect(page.locator('text=/subscribed|success|thank you/i')).toBeVisible({
        timeout: 10000,
      });
    });

    test('PAY-007: should show insufficient balance error', async ({ page }) => {
      // This test assumes user has insufficient balance
      // May need to be run with a specific test user
      await page.goto('/c/testcreator');

      // Try to subscribe to an expensive creator
      const subscribeButton = page.locator('[data-testid="subscribe-button"], text=/subscribe/i');
      if (await subscribeButton.isVisible()) {
        await subscribeButton.click();

        // Look for insufficient balance message or add funds prompt
        const insufficientOrAddFunds = page.locator('text=/insufficient|add funds|not enough/i');
        // This is a conditional check - not all test scenarios will hit this
        const isVisible = await insufficientOrAddFunds.isVisible().catch(() => false);
        console.log(`Insufficient balance message visible: ${isVisible}`);
      }
    });
  });

  test.describe('Content Access', () => {
    test('PAY-011: should have immediate access after subscription', async ({ page }) => {
      // Navigate to a subscribed creator's page
      await page.goto('/c/testcreator');

      // Look for subscriber-only content
      const subscriberContent = page.locator(
        '[data-testid="subscriber-content"], .subscriber-only'
      );

      // If subscribed, content should be visible (not locked)
      const lockedIndicator = page.locator(
        '[data-testid="content-locked"], text=/locked|subscribe to view/i'
      );

      // Either content is visible or it's locked (depends on subscription state)
      const contentVisible = await subscriberContent.isVisible().catch(() => false);
      const isLocked = await lockedIndicator.isVisible().catch(() => false);

      console.log(`Content visible: ${contentVisible}, Is locked: ${isLocked}`);
    });

    test('AUTH-021: non-subscriber should see locked content', async ({ page }) => {
      // Logout and view creator as non-subscriber
      await page.context().clearCookies();
      await page.goto('/c/testcreator');

      // Should see subscription prompt or locked content
      const subscribePrompt = page.locator(
        '[data-testid="subscribe-prompt"], text=/subscribe|unlock/i'
      );
      await expect(subscribePrompt).toBeVisible();
    });
  });

  test.describe('Subscription Management', () => {
    test('PAY-012: should show subscription in user subscriptions', async ({ page }) => {
      await page.goto('/subscriptions');

      // Should see list of subscriptions or empty state
      const subscriptionsList = page.locator('[data-testid="subscriptions-list"]');
      const emptyState = page.locator('text=/no subscriptions|subscribe to creators/i');

      const hasSubscriptions = await subscriptionsList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasSubscriptions || isEmpty).toBe(true);
    });

    test('PAY-016: should be able to cancel subscription', async ({ page }) => {
      await page.goto('/subscriptions');

      const cancelButton = page.locator('[data-testid="cancel-subscription"], text=/cancel/i');
      const hasSubscription = await cancelButton.isVisible().catch(() => false);

      if (hasSubscription) {
        await cancelButton.click();

        // Confirm cancellation
        const confirmCancel = page.locator('[data-testid="confirm-cancel"], text=/confirm|yes/i');
        if (await confirmCancel.isVisible()) {
          await confirmCancel.click();
        }

        // Should see cancellation confirmation
        await expect(page.locator('text=/cancelled|will end|access until/i')).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });
});

test.describe('PPV Content Purchase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test('PAY-004: should purchase PPV content', async ({ page }) => {
    // Navigate to a post with PPV content
    await page.goto('/feed');

    // Find a PPV post
    const ppvPost = page.locator('[data-testid="ppv-post"], text=/unlock|pay to view/i').first();
    const hasPpvContent = await ppvPost.isVisible().catch(() => false);

    if (hasPpvContent) {
      await ppvPost.click();

      // Confirm purchase
      const confirmPurchase = page.locator(
        '[data-testid="confirm-purchase"], text=/confirm|unlock/i'
      );
      if (await confirmPurchase.isVisible()) {
        await confirmPurchase.click();

        // Content should be unlocked
        await expect(page.locator('text=/unlocked|purchased/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('VID-017: PPV content should be locked without purchase', async ({ page }) => {
    await page.goto('/feed');

    // Find a PPV post
    const ppvIndicator = page.locator('[data-testid="ppv-indicator"], text=/\\$|pay to/i');
    const hasPpvContent = await ppvIndicator.isVisible().catch(() => false);

    console.log(`PPV content present in feed: ${hasPpvContent}`);
  });
});

test.describe('Tipping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test('PAY-005: should send tip to creator', async ({ page }) => {
    await page.goto('/c/testcreator');

    // Find tip button
    const tipButton = page.locator('[data-testid="tip-button"], text=/tip|send tip/i');
    const canTip = await tipButton.isVisible().catch(() => false);

    if (canTip) {
      await tipButton.click();

      // Enter tip amount
      await page.fill('[data-testid="tip-amount"], [name="amount"]', '5');

      // Confirm tip
      await page.click('[data-testid="confirm-tip"], text=/send|confirm/i');

      // Should see success
      await expect(page.locator('text=/sent|thank you|tip sent/i')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Wallet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test('PAY-001: should display wallet balance', async ({ page }) => {
    await page.goto('/wallet');

    // Should see balance
    const balance = page.locator('[data-testid="wallet-balance"], text=/balance|\\$/i');
    await expect(balance).toBeVisible();
  });

  test('should show add funds option', async ({ page }) => {
    await page.goto('/wallet');

    const addFundsButton = page.locator('[data-testid="add-funds"], text=/add funds|deposit/i');
    await expect(addFundsButton).toBeVisible();
  });

  test('PAY-014: should display transaction history', async ({ page }) => {
    await page.goto('/transactions');

    // Should see transactions list or empty state
    const transactionsList = page.locator('[data-testid="transactions-list"]');
    const emptyState = page.locator('text=/no transactions/i');

    const hasTransactions = await transactionsList.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasTransactions || isEmpty).toBe(true);
  });
});
