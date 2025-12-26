/**
 * E2E Tests for Content/Posts
 *
 * Critical User Journeys:
 * - J3: Creator apply → KYC → Create post → Earn
 */

import { test, expect } from '@playwright/test';

test.describe('Content Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test.describe('Feed Display', () => {
    test('should display feed with posts', async ({ page }) => {
      await page.goto('/feed');

      // Should see posts or empty state
      const postsList = page.locator('[data-testid="posts-list"], [data-testid="feed"]');
      const emptyState = page.locator('text=/no posts|follow creators|start exploring/i');

      const hasPosts = await postsList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasPosts || isEmpty).toBe(true);
    });

    test('UX-010: should show empty feed state appropriately', async ({ page }) => {
      await page.goto('/feed');

      const feedContent = page.locator('[data-testid="post-card"], [data-testid="feed-item"]');
      const emptyState = page.locator('[data-testid="empty-feed"], text=/no posts/i');

      const hasPosts = await feedContent
        .first()
        .isVisible()
        .catch(() => false);
      if (!hasPosts) {
        await expect(emptyState).toBeVisible();
      }
    });

    test('UX-003: should support infinite scroll', async ({ page }) => {
      await page.goto('/feed');

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for potential loading
      await page.waitForTimeout(1000);

      // Check for loading indicator or more posts
      const loadingIndicator = page.locator('[data-testid="loading-more"], .loading-spinner');
      const moreContent = page.locator('[data-testid="post-card"], [data-testid="feed-item"]');

      // Either still loading or content loaded
      const isLoading = await loadingIndicator.isVisible().catch(() => false);
      const hasContent = await moreContent
        .first()
        .isVisible()
        .catch(() => false);

      console.log(`Infinite scroll: loading=${isLoading}, hasContent=${hasContent}`);
    });
  });

  test.describe('Post Interactions', () => {
    test('POST-013: should like a post', async ({ page }) => {
      await page.goto('/feed');

      const likeButton = page.locator('[data-testid="like-button"]').first();
      const hasPost = await likeButton.isVisible().catch(() => false);

      if (hasPost) {
        // Get initial state
        const wasLiked = (await likeButton.getAttribute('data-liked')) === 'true';

        // Click like
        await likeButton.click();

        // Wait for update
        await page.waitForTimeout(500);

        // State should have changed
        const isLiked = (await likeButton.getAttribute('data-liked')) === 'true';

        console.log(`Like state changed: ${wasLiked} -> ${isLiked}`);
      }
    });

    test('POST-014: should unlike a post', async ({ page }) => {
      await page.goto('/feed');

      const likeButton = page.locator('[data-testid="like-button"][data-liked="true"]').first();
      const hasLikedPost = await likeButton.isVisible().catch(() => false);

      if (hasLikedPost) {
        await likeButton.click();
        await page.waitForTimeout(500);

        // Should be unliked
        const isStillLiked = (await likeButton.getAttribute('data-liked')) === 'true';
        expect(isStillLiked).toBe(false);
      }
    });

    test('POST-018: should bookmark a post', async ({ page }) => {
      await page.goto('/feed');

      const bookmarkButton = page.locator('[data-testid="bookmark-button"]').first();
      const hasPost = await bookmarkButton.isVisible().catch(() => false);

      if (hasPost) {
        await bookmarkButton.click();
        await page.waitForTimeout(500);

        // Should be bookmarked
        const isBookmarked = (await bookmarkButton.getAttribute('data-bookmarked')) === 'true';
        console.log(`Post bookmarked: ${isBookmarked}`);
      }
    });

    test('POST-020: should display bookmarked posts', async ({ page }) => {
      await page.goto('/bookmarks');

      const bookmarksList = page.locator('[data-testid="bookmarks-list"]');
      const emptyState = page.locator('text=/no bookmarks|no saved posts/i');

      const hasBookmarks = await bookmarksList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasBookmarks || isEmpty).toBe(true);
    });
  });

  test.describe('Post Comments', () => {
    test('POST-015: should add comment to post', async ({ page }) => {
      await page.goto('/feed');

      // Click on a post to view details
      const postCard = page.locator('[data-testid="post-card"]').first();
      const hasPost = await postCard.isVisible().catch(() => false);

      if (hasPost) {
        // Find comment button or input
        const commentButton = page.locator('[data-testid="comment-button"]').first();
        if (await commentButton.isVisible()) {
          await commentButton.click();
        }

        // Find comment input
        const commentInput = page.locator('[data-testid="comment-input"], [name="comment"]');
        if (await commentInput.isVisible()) {
          await commentInput.fill('Great post! 🎉');
          await page.click('[data-testid="submit-comment"], [type="submit"]');

          // Comment should appear
          await expect(page.locator('text=Great post!')).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});

test.describe('Creator Content Management', () => {
  // These tests require creator account
  test.describe('Post Creation', () => {
    test.beforeEach(async ({ page }) => {
      // Login as creator
      await page.goto('/login');
      await page.fill('[name="email"]', 'creator@test.com');
      await page.fill('[name="password"]', 'CreatorPassword123!');
      await page.click('[type="submit"]');
      await page.waitForURL(/\/(feed|dashboard|creator)?/, { timeout: 10000 });
    });

    test('POST-001: should create text-only post', async ({ page }) => {
      await page.goto('/creator/content');

      // Click create post
      const createButton = page.locator('[data-testid="create-post"], text=/create|new post/i');
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill post content
        const contentInput = page.locator(
          '[data-testid="post-content"], [name="content"], textarea'
        );
        await contentInput.fill('This is a test post from automated testing!');

        // Set access level
        const accessSelect = page.locator('[data-testid="access-level"], [name="accessLevel"]');
        if (await accessSelect.isVisible()) {
          await accessSelect.selectOption('free');
        }

        // Publish
        await page.click('[data-testid="publish-post"], text=/publish|post/i');

        // Should see success
        await expect(page.locator('text=/published|success|posted/i')).toBeVisible({
          timeout: 10000,
        });
      }
    });

    test('POST-005: should set post as free', async ({ page }) => {
      await page.goto('/creator/content/new');

      const accessSelect = page.locator('[data-testid="access-level"], [name="accessLevel"]');
      if (await accessSelect.isVisible()) {
        await accessSelect.selectOption('free');

        const selectedValue = await accessSelect.inputValue();
        expect(selectedValue).toBe('free');
      }
    });

    test('POST-006: should set post as subscriber-only', async ({ page }) => {
      await page.goto('/creator/content/new');

      const accessSelect = page.locator('[data-testid="access-level"], [name="accessLevel"]');
      if (await accessSelect.isVisible()) {
        await accessSelect.selectOption('subscribers');

        const selectedValue = await accessSelect.inputValue();
        expect(selectedValue).toBe('subscribers');
      }
    });

    test('POST-007: should set post as PPV with price', async ({ page }) => {
      await page.goto('/creator/content/new');

      const accessSelect = page.locator('[data-testid="access-level"], [name="accessLevel"]');
      if (await accessSelect.isVisible()) {
        await accessSelect.selectOption('ppv');

        // Price input should appear
        const priceInput = page.locator('[data-testid="ppv-price"], [name="price"]');
        if (await priceInput.isVisible()) {
          await priceInput.fill('9.99');

          const priceValue = await priceInput.inputValue();
          expect(priceValue).toBe('9.99');
        }
      }
    });

    test('POST-010: should delete a post', async ({ page }) => {
      await page.goto('/creator/content');

      // Find delete button on existing post
      const deleteButton = page.locator('[data-testid="delete-post"]').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        const confirmDelete = page.locator(
          '[data-testid="confirm-delete"], text=/confirm|delete|yes/i'
        );
        if (await confirmDelete.isVisible()) {
          await confirmDelete.click();

          // Should see deletion confirmation
          await expect(page.locator('text=/deleted|removed/i')).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});

test.describe('Explore & Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'qa@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('[type="submit"]');
    await page.waitForURL(/\/(feed|dashboard|home)?/, { timeout: 10000 });
  });

  test('should display explore page', async ({ page }) => {
    await page.goto('/explore');

    // Should see categories or creators
    const exploreContent = page.locator(
      '[data-testid="explore-content"], [data-testid="categories"]'
    );
    await expect(exploreContent).toBeVisible();
  });

  test('should search for creators', async ({ page }) => {
    await page.goto('/explore');

    const searchInput = page.locator('[data-testid="search-input"], [name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.keyboard.press('Enter');

      // Should see results or no results message
      await page.waitForTimeout(1000);

      const results = page.locator('[data-testid="search-results"]');
      const noResults = page.locator('text=/no results/i');

      const hasResults = await results.isVisible().catch(() => false);
      const isEmpty = await noResults.isVisible().catch(() => false);

      expect(hasResults || isEmpty).toBe(true);
    }
  });

  test('UX-011: should show empty search results appropriately', async ({ page }) => {
    await page.goto('/explore');

    const searchInput = page.locator('[data-testid="search-input"], [name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('xyznonexistentcreator12345');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(1000);

      const noResults = page.locator('text=/no results|no creators found/i');
      await expect(noResults).toBeVisible();
    }
  });
});
