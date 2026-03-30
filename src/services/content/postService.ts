import { Prisma } from '@prisma/client';

import { BookmarkRepository } from '@/repositories/bookmarkRepository';
import { BundlePurchaseRepository } from '@/repositories/bundlePurchaseRepository';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { LikeRepository } from '@/repositories/likeRepository';
import { MediaRepository } from '@/repositories/mediaRepository';
import { PostRepository } from '@/repositories/postRepository';
import { PpvRepository } from '@/repositories/ppvRepository';
import { SubscriptionRepository } from '@/repositories/subscriptionRepository';
import { TagService } from '@/services/content/tagService';
import type {
  CreatePostInput,
  UpdatePostInput,
  PostWithCreator,
  PostFilters,
  AccessCheckResult,
} from '@/types/content';

export class PostService {
  private postRepo: PostRepository;
  private mediaRepo: MediaRepository;
  private likeRepo: LikeRepository;
  private bookmarkRepo: BookmarkRepository;
  private creatorRepo: CreatorRepository;
  private subscriptionRepo: SubscriptionRepository;
  private ppvRepo: PpvRepository;
  private bundlePurchaseRepo: BundlePurchaseRepository;
  private tagService: TagService;

  constructor() {
    this.postRepo = new PostRepository();
    this.mediaRepo = new MediaRepository();
    this.likeRepo = new LikeRepository();
    this.bookmarkRepo = new BookmarkRepository();
    this.creatorRepo = new CreatorRepository();
    this.subscriptionRepo = new SubscriptionRepository();
    this.ppvRepo = new PpvRepository();
    this.bundlePurchaseRepo = new BundlePurchaseRepository();
    this.tagService = new TagService();
  }

  /**
   * Create a new post
   */
  async create(creatorId: string, input: CreatePostInput) {
    // Calculate expiry for stories (24 hours)
    let expiresAt: Date | undefined;
    if (input.postType === 'story') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const post = await this.postRepo.create({
      creatorId,
      content: input.content,
      postType: input.postType,
      accessLevel: input.accessLevel,
      ppvPrice: input.ppvPrice,
      metadata:
        input.categoryIds && input.categoryIds.length > 0
          ? ({ categoryIds: input.categoryIds } as unknown as Prisma.InputJsonValue)
          : undefined,
      isNsfw: input.isNsfw,
      commentsEnabled: input.commentsEnabled,
      scheduledAt: input.scheduledAt,
      expiresAt,
      status:
        input.status === 'published' || input.status === 'scheduled' || input.status === 'draft'
          ? input.status
          : input.scheduledAt
            ? 'scheduled'
            : 'draft',
      previewConfig: input.previewConfig as unknown as Prisma.InputJsonValue,
      overlays: input.overlays as unknown as Prisma.InputJsonValue,
    });

    // Attach media if provided
    if (input.mediaIds?.length) {
      await this.mediaRepo.bulkAttachToPost(input.mediaIds, post.id);
    }

    if (input.tags) {
      await this.tagService.setPostTags(post.id, input.tags);
    }

    return post;
  }

  /**
   * Get post by ID with access check
   */
  async getById(id: string, viewerId?: string): Promise<PostWithCreator | null> {
    const post = await this.postRepo.findById(id);
    if (!post) return null;

    // Transform to API format
    const formatted = this.formatPost(post);

    // Add user engagement status
    if (viewerId) {
      const [isLiked, isBookmarked] = await Promise.all([
        this.likeRepo.exists(viewerId, id),
        this.bookmarkRepo.exists(viewerId, id),
      ]);
      formatted.isLiked = isLiked;
      formatted.isBookmarked = isBookmarked;
    }

    // Check access
    const access = await this.checkAccess(id, viewerId);
    formatted.hasAccess = access.hasAccess;

    // Increment view count (async, don't await)
    void this.postRepo.incrementViewCount(id);

    return formatted;
  }

  /**
   * Update post
   */
  async update(id: string, creatorId: string, input: UpdatePostInput) {
    const post = await this.postRepo.findById(id);
    if (!post) throw new Error('Post not found');
    if (post.creatorId !== creatorId) throw new Error('Unauthorized');

    const updated = await this.postRepo.update(id, {
      content: input.content,
      accessLevel: input.accessLevel,
      ppvPrice: input.ppvPrice,
      isNsfw: input.isNsfw,
      commentsEnabled: input.commentsEnabled,
      isPinned: input.isPinned,
    });

    if (input.tags) {
      await this.tagService.setPostTags(id, input.tags);
    }

    return updated;
  }

  /**
   * Delete post
   */
  async delete(id: string, creatorId: string) {
    const post = await this.postRepo.findById(id);
    if (!post) throw new Error('Post not found');
    if (post.creatorId !== creatorId) throw new Error('Unauthorized');

    return this.postRepo.delete(id);
  }

  /**
   * Publish a draft post
   */
  async publish(id: string, creatorId: string) {
    const post = await this.postRepo.findById(id);
    if (!post) throw new Error('Post not found');
    if (post.creatorId !== creatorId) throw new Error('Unauthorized');
    if (post.status !== 'draft') throw new Error('Post is not a draft');

    return this.postRepo.publish(id);
  }

  /**
   * Schedule a post
   */
  async schedule(id: string, creatorId: string, scheduledAt: Date) {
    const post = await this.postRepo.findById(id);
    if (!post) throw new Error('Post not found');
    if (post.creatorId !== creatorId) throw new Error('Unauthorized');
    if (scheduledAt <= new Date()) throw new Error('Scheduled time must be in the future');

    return this.postRepo.schedule(id, scheduledAt);
  }

  /**
   * List posts by creator
   */
  async listByCreator(creatorId: string, filters: PostFilters = {}) {
    const limit = filters.limit ?? 20;
    const posts = await this.postRepo.findByCreator(creatorId, { ...filters, limit });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;

    return {
      posts: items.map((p) => this.formatPost(p)),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Check if user has access to post content
   */
  async checkAccess(postId: string, userId?: string): Promise<AccessCheckResult> {
    const post = await this.postRepo.findById(postId);
    if (!post) {
      return { hasAccess: false, reason: 'no_access', canPurchase: false };
    }

    // Free posts are accessible to everyone
    if (post.accessLevel === 'free') {
      return { hasAccess: true, reason: 'free', canPurchase: false };
    }

    if (!userId) {
      return {
        hasAccess: false,
        reason: 'no_access',
        canPurchase: post.accessLevel === 'ppv',
        price: post.ppvPrice?.toNumber(),
      };
    }

    // Owner access
    const viewerCreatorProfile = await this.creatorRepo.findByUserId(userId);
    if (viewerCreatorProfile && viewerCreatorProfile.id === post.creatorId) {
      return { hasAccess: true, reason: 'owner', canPurchase: false };
    }

    // Check subscription for subscriber-only content
    if (post.accessLevel === 'subscribers') {
      const isSubscribed = await this.subscriptionRepo.isSubscribed(userId, post.creatorId);
      if (isSubscribed) {
        return { hasAccess: true, reason: 'subscribed', canPurchase: false };
      }
      const viaBundle = await this.bundlePurchaseRepo.hasPurchasedPost(userId, postId);
      if (viaBundle) {
        return { hasAccess: true, reason: 'purchased', canPurchase: false };
      }
    }

    // Check PPV purchase
    if (post.accessLevel === 'ppv') {
      const hasPurchased = await this.ppvRepo.hasPurchased(userId, postId);
      if (hasPurchased) {
        return { hasAccess: true, reason: 'purchased', canPurchase: false };
      }
      const viaBundle = await this.bundlePurchaseRepo.hasPurchasedPost(userId, postId);
      if (viaBundle) {
        return { hasAccess: true, reason: 'purchased', canPurchase: false };
      }
      return {
        hasAccess: false,
        reason: 'no_access',
        canPurchase: true,
        price: post.ppvPrice?.toNumber(),
      };
    }

    // For subscribers access level without active subscription
    return {
      hasAccess: false,
      reason: 'no_access',
      canPurchase: false,
    };
  }

  /**
   * Format post for API response
   */
  private formatPost(
    post: NonNullable<Awaited<ReturnType<PostRepository['findById']>>>
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
      previewConfig: post.previewConfig as unknown as CreatePostInput['previewConfig'],
      overlays: post.overlays as unknown as CreatePostInput['overlays'],
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
}
