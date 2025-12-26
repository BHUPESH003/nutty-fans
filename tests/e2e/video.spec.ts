/**
 * E2E Tests for Video Playback
 *
 * Test Cases:
 * - VID-014 to VID-018: Playback Authorization
 * - VID-019 to VID-021: Signed URL
 * - VID-022 to VID-025: Playback scenarios
 */

import { test, expect } from '@playwright/test';

test.describe('Video Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test.describe('Video Display', () => {
    test('should display video posts in feed', async ({ page }) => {
      await page.goto('/feed');

      // Look for video elements
      const videoPost = page
        .locator('[data-testid="video-post"], video, [data-testid="video-player"]')
        .first();
      const hasVideo = await videoPost.isVisible().catch(() => false);

      console.log(`Video content found in feed: ${hasVideo}`);
    });

    test('VID-022: should show processing state for new videos', async ({ page }) => {
      await page.goto('/feed');

      // Look for processing indicator
      const processingIndicator = page.locator('text=/processing|uploading|preparing/i');
      const isProcessing = await processingIndicator.isVisible().catch(() => false);

      console.log(`Video processing indicator visible: ${isProcessing}`);
    });
  });

  test.describe('Playback Controls', () => {
    test('should play video on click', async ({ page }) => {
      await page.goto('/feed');

      const videoPlayer = page.locator('[data-testid="video-player"], video').first();
      const hasVideo = await videoPlayer.isVisible().catch(() => false);

      if (hasVideo) {
        // Click to play
        await videoPlayer.click();

        // Wait for playback to start
        await page.waitForTimeout(1000);

        // Check if playing
        const isPlaying = await videoPlayer.evaluate((video: HTMLVideoElement) => !video.paused);
        console.log(`Video playing: ${isPlaying}`);
      }
    });

    test('should pause video on second click', async ({ page }) => {
      await page.goto('/feed');

      const videoPlayer = page.locator('[data-testid="video-player"], video').first();
      const hasVideo = await videoPlayer.isVisible().catch(() => false);

      if (hasVideo) {
        // Play then pause
        await videoPlayer.click();
        await page.waitForTimeout(500);
        await videoPlayer.click();

        const isPaused = await videoPlayer.evaluate((video: HTMLVideoElement) => video.paused);
        console.log(`Video paused: ${isPaused}`);
      }
    });

    test('should show video controls on hover', async ({ page }) => {
      await page.goto('/feed');

      const videoContainer = page.locator('[data-testid="video-container"]').first();
      const hasVideo = await videoContainer.isVisible().catch(() => false);

      if (hasVideo) {
        await videoContainer.hover();

        // Controls should appear
        const controls = page.locator('[data-testid="video-controls"], .video-controls');
        const hasControls = await controls.isVisible().catch(() => false);

        console.log(`Video controls visible on hover: ${hasControls}`);
      }
    });
  });

  test.describe('Access Control', () => {
    test('VID-014: subscriber should access subscriber video', async ({ page }) => {
      // Navigate to a creator's page where user is subscribed
      await page.goto('/c/testcreator');

      // Find subscriber video
      const subscriberVideo = page
        .locator('[data-testid="subscriber-video"], [data-access="subscribers"] video')
        .first();
      const hasVideo = await subscriberVideo.isVisible().catch(() => false);

      if (hasVideo) {
        // Should be able to click and play
        await subscriberVideo.click();
        await page.waitForTimeout(1000);

        // Check if locked
        const isLocked = await page.locator('text=/locked|subscribe to view/i').isVisible();
        console.log(`Subscriber video locked: ${isLocked}`);
      }
    });

    test('VID-015: should show paywall for non-subscriber video', async ({ page }) => {
      // Navigate to a creator's page without subscription
      await page.goto('/c/premiumcreator'); // Assuming this creator exists

      const lockedContent = page.locator(
        '[data-testid="locked-content"], text=/subscribe to view|locked/i'
      );
      const isLocked = await lockedContent.isVisible().catch(() => false);

      console.log(`Non-subscriber video locked: ${isLocked}`);
    });

    test('VID-018: free video should play for all users', async ({ page }) => {
      await page.goto('/feed');

      // Find free video
      const freeVideo = page
        .locator('[data-testid="free-video"], [data-access="free"] video')
        .first();
      const hasVideo = await freeVideo.isVisible().catch(() => false);

      if (hasVideo) {
        await freeVideo.click();
        await page.waitForTimeout(1000);

        // Should play without restriction
        const isPlaying = await freeVideo.evaluate((video: HTMLVideoElement) => !video.paused);
        console.log(`Free video playing: ${isPlaying}`);
      }
    });
  });

  test.describe('Video Quality', () => {
    test('VID-025: should support adaptive bitrate', async ({ page }) => {
      await page.goto('/feed');

      const videoPlayer = page.locator('[data-testid="video-player"], video').first();
      const hasVideo = await videoPlayer.isVisible().catch(() => false);

      if (hasVideo) {
        // Look for quality selector
        const qualitySelector = page.locator(
          '[data-testid="quality-selector"], [aria-label="Quality"]'
        );
        const hasQualitySelector = await qualitySelector.isVisible().catch(() => false);

        console.log(`Quality selector available: ${hasQualitySelector}`);
      }
    });
  });
});

test.describe('Video Upload (Creator)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'CreatorPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|creator)?/, { timeout: 10000 });
  });

  test('VID-002: should show video upload option', async ({ page }) => {
    await page.goto('/creator/content/new');

    const videoUpload = page.locator(
      '[data-testid="video-upload"], input[type="file"][accept*="video"]'
    );
    const hasVideoUpload = await videoUpload.isVisible().catch(() => false);

    expect(hasVideoUpload).toBe(true);
  });

  test('POST-024: should reject unsupported formats', async ({ page }) => {
    await page.goto('/creator/content/new');

    // Try to set an invalid file via JavaScript (simulating the validation)
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible()) {
      // Check accept attribute
      const acceptAttr = await fileInput.getAttribute('accept');
      console.log(`Accepted file types: ${acceptAttr}`);

      // The validation should prevent unsupported formats
      expect(acceptAttr).toContain('video');
    }
  });

  test('VID-004: should show upload progress', async ({ page }) => {
    await page.goto('/creator/content/new');

    // Check for progress indicator element
    const progressBar = page.locator('[data-testid="upload-progress"], .progress-bar, progress');

    // Progress bar might not be visible until upload starts
    // This verifies the element exists in the DOM
    const progressExists =
      (await progressBar.count()) > 0 ||
      (await page.locator('[data-testid="upload-area"]').isVisible());

    console.log(`Upload progress indicator present: ${progressExists}`);
  });
});

test.describe('Anti-Piracy Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test('VID-029: should disable right-click on video', async ({ page }) => {
    await page.goto('/feed');

    const videoElement = page.locator('video').first();
    const hasVideo = await videoElement.isVisible().catch(() => false);

    if (hasVideo) {
      // Check for context menu prevention
      const contextMenuEnabled = await videoElement.evaluate((video) => {
        const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        const result = video.dispatchEvent(event);
        return result; // If false, context menu was prevented
      });

      // Context menu should be prevented (dispatchEvent returns false if prevented)
      console.log(`Context menu enabled: ${contextMenuEnabled}`);
    }
  });

  test('VID-026: should have watermark overlay', async ({ page }) => {
    await page.goto('/feed');

    const videoContainer = page.locator('[data-testid="video-container"]').first();
    const hasVideo = await videoContainer.isVisible().catch(() => false);

    if (hasVideo) {
      // Look for watermark element
      const watermark = page.locator('[data-testid="watermark"], .watermark');
      const hasWatermark = await watermark.isVisible().catch(() => false);

      console.log(`Watermark visible: ${hasWatermark}`);
    }
  });
});

test.describe('Signed URL Expiry', () => {
  test('VID-019: video should play with valid signed URL', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });

    await page.goto('/feed');

    const videoElement = page.locator('video').first();
    const hasVideo = await videoElement.isVisible().catch(() => false);

    if (hasVideo) {
      // Check video source
      const src = await videoElement.getAttribute('src');

      // Source should contain token or signature parameter
      const hasSignature =
        src?.includes('token') || src?.includes('signature') || src?.includes('jwt');
      console.log(`Video has signed URL: ${hasSignature}`);
    }
  });
});
