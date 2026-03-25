import { cacheService, cacheKeys } from '@/lib/cache/cacheService';
import { BookmarkRepository } from '@/repositories/bookmarkRepository';
import { BundlePurchaseRepository } from '@/repositories/bundlePurchaseRepository';
import { LikeRepository } from '@/repositories/likeRepository';
import { PostRepository } from '@/repositories/postRepository';
import { PpvRepository } from '@/repositories/ppvRepository';
import { SubscriptionRepository } from '@/repositories/subscriptionRepository';
import type { FeedResult, PostWithCreator } from '@/types/content';

export class FeedService {
  private postRepo: PostRepository;
  private likeRepo: LikeRepository;
  private bookmarkRepo: BookmarkRepository;
  private subscriptionRepo: SubscriptionRepository;
  private ppvRepo: PpvRepository;
  private bundlePurchaseRepo: BundlePurchaseRepository;

  constructor() {
    this.postRepo = new PostRepository();
    this.likeRepo = new LikeRepository();
    this.bookmarkRepo = new BookmarkRepository();
    this.subscriptionRepo = new SubscriptionRepository();
    this.ppvRepo = new PpvRepository();
    this.bundlePurchaseRepo = new BundlePurchaseRepository();
  }

  /**
   * Get feed from subscribed creators
   */
  async getSubscribedFeed(userId: string, cursor?: string, limit = 20): Promise<FeedResult> {
    // Cache feed for 30 seconds (short cache for real-time feel)
    const cacheKey = cacheKeys.postFeed(userId, cursor);

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        const posts = await this.postRepo.getSubscribedFeed(userId, cursor, limit);

        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        const formattedPosts = items.map((p) => this.formatPost(p));

        // Batch load engagement status
        if (formattedPosts.length > 0) {
          await this.addEngagementStatus(formattedPosts, userId);
        }

        return {
          posts: formattedPosts,
          nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
          hasMore,
        };
      },
      30 * 1000 // 30 seconds cache
    );
  }

  /**
   * Get explore feed (public content)
   * Only includes FREE and PPV content
   * PPV content media URLs are stripped until user has purchased
   */
  async getExploreFeed(cursor?: string, limit = 20, userId?: string): Promise<FeedResult> {
    // Don't cache per-user since access varies
    const posts = await this.postRepo.getExploreFeed(cursor, limit);

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const formattedPosts = items.map((p) => this.formatPost(p));

    // Add engagement status if user is logged in
    if (userId && formattedPosts.length > 0) {
      await this.addEngagementStatus(formattedPosts, userId);
      // Also add access status for PPV content
      await this.addAccessStatus(formattedPosts, userId);
    } else {
      // For non-logged-in users, only free content is accessible
      for (const post of formattedPosts) {
        post.hasAccess = post.accessLevel === 'free';
      }
    }

    // SECURITY: Strip media URLs from locked PPV content
    // This prevents users from accessing media via network tab
    this.stripLockedMedia(formattedPosts);

    return {
      posts: formattedPosts,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Get creator's public posts
   */
  async getCreatorPublicPosts(creatorId: string, cursor?: string, limit = 20): Promise<FeedResult> {
    const posts = await this.postRepo.getCreatorPublicPosts(creatorId, cursor, limit);

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return {
      posts: items.map((p) => this.formatPostSimple(p)),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Get reels feed (video/reel posts optimized for vertical browsing)
   * Uses same Post model, just filtered for video content
   */
  async getReelsFeed(userId?: string, cursor?: string, limit = 10): Promise<FeedResult> {
    const cacheKey = `reels:${cursor || 'initial'}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        // Get posts that are reels or have video media
        const posts = await this.postRepo.getReelsFeed(cursor, limit);

        const hasMore = posts.length > limit;
        const items = hasMore ? posts.slice(0, limit) : posts;
        const formattedPosts = items.map((p) => this.formatPost(p));

        // Add engagement status if user is logged in
        if (userId && formattedPosts.length > 0) {
          await this.addEngagementStatus(formattedPosts, userId);
        }

        // Add hasAccess based on access level and user
        for (const post of formattedPosts) {
          if (post.accessLevel === 'free') {
            post.hasAccess = true;
          } else if (!userId) {
            post.hasAccess = false;
          } else {
            // TODO: Check actual access via subscriptions/purchases
            post.hasAccess = false;
          }
        }

        return {
          posts: formattedPosts,
          nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
          hasMore,
        };
      },
      30 * 1000 // 30 seconds cache
    );
  }

  /**
   * Add like/bookmark status to posts
   */
  private async addEngagementStatus(posts: PostWithCreator[], userId: string) {
    const postIds = posts.map((p) => p.id);

    const [likedIds, bookmarkedIds] = await Promise.all([
      this.likeRepo.getLikedPostIds(userId, postIds),
      this.bookmarkRepo.getBookmarkedPostIds(userId, postIds),
    ]);

    const likedSet = new Set(likedIds);
    const bookmarkedSet = new Set(bookmarkedIds);

    for (const post of posts) {
      post.isLiked = likedSet.has(post.id);
      post.isBookmarked = bookmarkedSet.has(post.id);
    }
  }

  /**
   * Add access status (hasAccess) to posts based on subscriptions and PPV purchases
   */
  private async addAccessStatus(posts: PostWithCreator[], userId: string) {
    const postIds = posts.map((p) => p.id);
    const creatorIds = [...new Set(posts.map((p) => p.creatorId))];

    const [subscribedCreatorIdsArr, ppvPurchasedPostIds, bundlePurchasedPostIds] =
      await Promise.all([
        this.subscriptionRepo.getActiveCreatorIds(userId, creatorIds),
        this.ppvRepo.getPurchasedPostIds(userId, postIds),
        this.bundlePurchaseRepo.getPurchasedPostIds(userId, postIds),
      ]);

    const subscribedCreatorIds = new Set(subscribedCreatorIdsArr);
    const purchasedPostIds = new Set(ppvPurchasedPostIds);
    const bundlePostIds = new Set(bundlePurchasedPostIds);

    for (const post of posts) {
      if (post.accessLevel === 'free') {
        post.hasAccess = true;
      } else if (post.accessLevel === 'subscribers') {
        post.hasAccess = subscribedCreatorIds.has(post.creatorId) || bundlePostIds.has(post.id);
      } else if (post.accessLevel === 'ppv') {
        // PPV can be accessed via subscription OR purchase
        post.hasAccess =
          subscribedCreatorIds.has(post.creatorId) ||
          purchasedPostIds.has(post.id) ||
          bundlePostIds.has(post.id);
      } else {
        post.hasAccess = false;
      }
    }
  }

  /**
   * SECURITY: Strip media URLs from posts where user doesn't have access
   * This prevents accessing content via network tab inspection
   * Only thumbnailUrl is kept for preview display with blur overlay
   */
  private stripLockedMedia(posts: PostWithCreator[]) {
    for (const post of posts) {
      if (!post.hasAccess) {
        for (const media of post.media) {
          // Set to placeholder that won't trigger browser download
          // Components should check hasAccess before rendering media
          media.originalUrl = 'locked';
          media.processedUrl = null;
          // Keep thumbnailUrl for blurred preview - UI will apply blur overlay
          // Keep previewUrl if it's a low-quality teaser
        }
      }
    }
  }

  /**
   * Format post with full creator info
   */
  private formatPost(
    post: NonNullable<Awaited<ReturnType<PostRepository['getSubscribedFeed']>>[0]>
  ): PostWithCreator {
    const creator = post.creator;
    const user = creator.user;

    return {
      id: post.id,
      creatorId: post.creatorId,
      content: post.content,
      postType: post.postType,
      accessLevel: post.accessLevel,
      ppvPrice: post.ppvPrice?.toNumber() ?? null,
      isPinned: post.isPinned,
      isNsfw: post.isNsfw,
      commentsEnabled: post.commentsEnabled,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      status: post.status,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      expiresAt: post.expiresAt,
      createdAt: post.createdAt,
      previewConfig: post.previewConfig as unknown as PostWithCreator['previewConfig'],
      overlays: post.overlays as unknown as PostWithCreator['overlays'],
      creator: {
        id: creator.id,
        handle: user.username ?? 'user',
        displayName: user.displayName ?? 'User',
        avatarUrl: user.avatarUrl,
        isVerified: creator.isVerified,
      },
      tags: (post.postTags ?? []).map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
      media: post.media.map((m) => ({
        id: m.id,
        mediaType: m.mediaType,
        originalUrl: m.originalUrl,
        processedUrl: m.processedUrl,
        thumbnailUrl: m.thumbnailUrl,
        previewUrl: m.previewUrl,
        width: m.width,
        height: m.height,
        duration: m.duration,
        processingStatus: m.processingStatus,
        sortOrder: m.sortOrder,
      })),
    };
  }

  /**
   * Format post without full creator info (for public endpoints)
   */
  private formatPostSimple(
    post: NonNullable<Awaited<ReturnType<PostRepository['getCreatorPublicPosts']>>[0]>
  ): PostWithCreator {
    return {
      id: post.id,
      creatorId: post.creatorId,
      content: post.content,
      postType: post.postType,
      accessLevel: post.accessLevel,
      ppvPrice: post.ppvPrice?.toNumber() ?? null,
      isPinned: post.isPinned,
      isNsfw: post.isNsfw,
      commentsEnabled: post.commentsEnabled,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      status: post.status,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      expiresAt: post.expiresAt,
      createdAt: post.createdAt,
      previewConfig: post.previewConfig as unknown as PostWithCreator['previewConfig'],
      overlays: post.overlays as unknown as PostWithCreator['overlays'],
      creator: {
        id: post.creatorId,
        handle: '',
        displayName: '',
        avatarUrl: null,
        isVerified: false,
      },
      tags: (post.postTags ?? []).map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
      media: post.media.map((m) => ({
        id: m.id,
        mediaType: m.mediaType,
        originalUrl: m.originalUrl,
        processedUrl: m.processedUrl,
        thumbnailUrl: m.thumbnailUrl,
        previewUrl: m.previewUrl,
        width: m.width,
        height: m.height,
        duration: m.duration,
        processingStatus: m.processingStatus,
        sortOrder: m.sortOrder,
      })),
    };
  }
}
