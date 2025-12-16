import { BookmarkRepository } from '@/repositories/bookmarkRepository';
import { LikeRepository } from '@/repositories/likeRepository';
import { PostRepository } from '@/repositories/postRepository';
import type { FeedResult, PostWithCreator } from '@/types/content';

export class FeedService {
  private postRepo: PostRepository;
  private likeRepo: LikeRepository;
  private bookmarkRepo: BookmarkRepository;

  constructor() {
    this.postRepo = new PostRepository();
    this.likeRepo = new LikeRepository();
    this.bookmarkRepo = new BookmarkRepository();
  }

  /**
   * Get feed from subscribed creators
   */
  async getSubscribedFeed(userId: string, cursor?: string, limit = 20): Promise<FeedResult> {
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
  }

  /**
   * Get explore feed (public content)
   */
  async getExploreFeed(cursor?: string, limit = 20, userId?: string): Promise<FeedResult> {
    const posts = await this.postRepo.getExploreFeed(cursor, limit);

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const formattedPosts = items.map((p) => this.formatPost(p));

    // Add engagement status if user is logged in
    if (userId && formattedPosts.length > 0) {
      await this.addEngagementStatus(formattedPosts, userId);
    }

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
      creator: {
        id: creator.id,
        handle: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: creator.isVerified,
      },
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
      creator: {
        id: post.creatorId,
        handle: '',
        displayName: '',
        avatarUrl: null,
        isVerified: false,
      },
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
