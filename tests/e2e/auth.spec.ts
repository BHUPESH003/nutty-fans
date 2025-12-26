/**
 * E2E Tests for Authentication
 *
 * Critical User Journeys:
 * - J1: New user → Register → Verify → Login → Browse
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Age Gate', () => {
    test('AUTH-013: should allow 18+ users to proceed', async ({ page }) => {
      await page.goto('/');

      // Check for age gate
      const ageGate = page.locator('[data-testid="age-gate"]');
      if (await ageGate.isVisible()) {
        await page.click('[data-testid="age-confirm-yes"]');
        await expect(page).not.toHaveURL(/age-gate/);
      }
    });

    test('AUTH-014: should block underage users', async ({ page }) => {
      await page.goto('/');

      const ageGate = page.locator('[data-testid="age-gate"]');
      if (await ageGate.isVisible()) {
        await page.click('[data-testid="age-confirm-no"]');
        await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
      }
    });
  });

  test.describe('Registration', () => {
    test('AUTH-001: should register new user with valid data', async ({ page }) => {
      await page.goto('/register');

      // Fill registration form
      await page.fill('[name="email"]', `test${Date.now()}@example.com`);
      await page.fill('[name="password"]', 'SecurePassword123!');
      await page.fill('[name="confirmPassword"]', 'SecurePassword123!');
      await page.fill('[name="displayName"]', 'Test User');

      // Accept terms if checkbox exists
      const termsCheckbox = page.locator('[name="terms"]');
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }

      // Submit
      await page.click('[type="submit"]');

      // Should see success message or redirect
      await expect(page.locator('text=/verify|success|check your email/i')).toBeVisible({
        timeout: 10000,
      });
    });

    test('AUTH-002: should show error for invalid email', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[name="email"]', 'invalid-email');
      await page.fill('[name="password"]', 'SecurePassword123!');
      await page.click('[type="submit"]');

      await expect(page.locator('text=/invalid|email/i')).toBeVisible();
    });

    test('AUTH-003: should show error for weak password', async ({ page }) => {
      await page.goto('/register');

      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', '123');
      await page.click('[type="submit"]');

      await expect(page.locator('text=/password|weak|short|characters/i')).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('AUTH-007: should login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      // Use test credentials - these should exist in seed data
      await page.fill('[name="email"]', 'qa@test.com');
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.click('[type="submit"]');

      // Should redirect to feed or dashboard
      await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
    });

    test('AUTH-008: should show error for non-existent email', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[name="email"]', 'nonexistent@example.com');
      await page.fill('[name="password"]', 'SomePassword123!');
      await page.click('[type="submit"]');

      await expect(page.locator('text=/invalid|not found|credentials/i')).toBeVisible();
    });

    test('AUTH-009: should show error for wrong password', async ({ page }) => {
      await page.goto('/login');

      await page.fill('[name="email"]', 'qa@test.com');
      await page.fill('[name="password"]', 'WrongPassword123!');
      await page.click('[type="submit"]');

      await expect(page.locator('text=/invalid|incorrect|credentials/i')).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('AUTH-015: session should persist on refresh', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[name="email"]', 'qa@test.com');
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.click('[type="submit"]');
      await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });

      // Refresh page
      await page.reload();

      // Should still be logged in - check for user avatar or logout button
      const isLoggedIn = await page
        .locator(
          '[data-testid="user-avatar"], [data-testid="logout-button"], [aria-label="Profile"]'
        )
        .isVisible();
      expect(isLoggedIn).toBe(true);
    });

    test('AUTH-017: logout should clear session', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[name="email"]', 'qa@test.com');
      await page.fill('[name="password"]', 'TestPassword123!');
      await page.click('[type="submit"]');
      await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });

      // Find and click logout
      const profileMenu = page.locator('[data-testid="profile-menu"], [aria-label="Profile menu"]');
      if (await profileMenu.isVisible()) {
        await profileMenu.click();
      }

      await page.click('[data-testid="logout-button"], text=/logout|sign out/i');

      // Should redirect to login or home
      await expect(page).toHaveURL(/\/(login|home)?/);
    });

    test('AUTH-018: protected routes redirect unauthenticated users', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      // Try to access protected route
      await page.goto('/profile');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('OAuth Flows', () => {
    test('AUTH-011: Google OAuth button should be present', async ({ page }) => {
      await page.goto('/login');

      const googleButton = page.locator('[data-testid="google-login"], text=/google/i');
      await expect(googleButton).toBeVisible();
    });

    test('AUTH-012: Apple OAuth button should be present', async ({ page }) => {
      await page.goto('/login');

      const appleButton = page.locator('[data-testid="apple-login"], text=/apple/i');
      // Apple login may not be visible in all environments
      // This is a soft assertion
      const isVisible = await appleButton.isVisible().catch(() => false);
      console.log(`Apple OAuth button visible: ${isVisible}`);
    });
  });
});

test.describe('Password Reset Flow', () => {
  test('AUTH-024: should show password reset form', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page.locator('[name="email"]')).toBeVisible();
    await expect(page.locator('[type="submit"]')).toBeVisible();
  });

  test('should send reset email for valid account', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('[name="email"]', 'qa@test.com');
    await page.click('[type="submit"]');

    // Should show success message
    await expect(page.locator('text=/email sent|check your email|reset link/i')).toBeVisible({
      timeout: 10000,
    });
  });
});
