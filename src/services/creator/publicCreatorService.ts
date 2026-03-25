import { BookmarkRepository } from '@/repositories/bookmarkRepository';
import { BundlePurchaseRepository } from '@/repositories/bundlePurchaseRepository';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { LikeRepository } from '@/repositories/likeRepository';
import { PostRepository } from '@/repositories/postRepository';
import { PpvRepository } from '@/repositories/ppvRepository';
import { SubscriptionRepository } from '@/repositories/subscriptionRepository';
import type { FeedResult, PostWithCreator } from '@/types/content';

export class PublicCreatorService {
  constructor(
    private readonly creatorRepo = new CreatorRepository(),
    private readonly postRepo = new PostRepository(),
    private readonly subscriptionRepo = new SubscriptionRepository(),
    private readonly ppvRepo = new PpvRepository(),
    private readonly likeRepo = new LikeRepository(),
    private readonly bookmarkRepo = new BookmarkRepository(),
    private readonly bundlePurchaseRepo = new BundlePurchaseRepository()
  ) {}

  async getPublicProfile(handle: string, viewerId?: string) {
    const profile = await this.creatorRepo.findByHandle(handle);
    if (!profile) return null;

    await this.creatorRepo.incrementProfileViews(profile.id);

    const [subscriberCount, isSubscribed] = await Promise.all([
      this.creatorRepo.getSubscriberCount(profile.id),
      viewerId ? this.subscriptionRepo.isSubscribed(viewerId, profile.id) : Promise.resolve(false),
    ]);

    return {
      id: profile.id,
      handle: profile.user.username ?? 'user',
      displayName: profile.user.displayName ?? 'User',
      bio: profile.bio,
      avatarUrl: profile.user.avatarUrl,
      coverImageUrl: profile.coverImageUrl,
      isVerified: profile.isVerified,
      subscriberCount,
      postCount: profile.totalPosts,
      subscriptionPrice: Number(profile.subscriptionPrice),
      socialLinks: profile.socialLinks as Record<string, string>,
      category: profile.category ? { id: profile.category.id, name: profile.category.name } : null,
      isSubscribed,
    };
  }

  async getPublicPostsByHandle(
    handle: string,
    viewerId?: string,
    params?: { cursor?: string; limit?: number }
  ): Promise<{ creatorId: string; feed: FeedResult } | null> {
    const creator = await this.creatorRepo.findByHandle(handle);
    if (!creator) return null;

    const limit = params?.limit ?? 20;
    const posts = await this.postRepo.findByCreator(creator.id, {
      status: 'published',
      cursor: params?.cursor,
      limit,
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const formattedPosts: PostWithCreator[] = items.map((p) => this.formatPost(p));

    if (formattedPosts.length === 0) {
      return {
        creatorId: creator.id,
        feed: {
          posts: [],
          nextCursor: null,
          hasMore: false,
        },
      };
    }

    if (!viewerId) {
      // Non-logged-in users: only free content accessible.
      for (const post of formattedPosts) {
        post.hasAccess = post.accessLevel === 'free';
      }
      this.stripLockedMedia(formattedPosts);

      return {
        creatorId: creator.id,
        feed: {
          posts: formattedPosts,
          nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
          hasMore,
        },
      };
    }

    const postIds = formattedPosts.map((p) => p.id);

    const [isSubscribed, purchasedIds, bundlePurchasedIds, likedIds, bookmarkedIds] =
      await Promise.all([
        this.subscriptionRepo.isSubscribed(viewerId, creator.id),
        this.ppvRepo.getPurchasedPostIds(viewerId, postIds),
        this.bundlePurchaseRepo.getPurchasedPostIds(viewerId, postIds),
        this.likeRepo.getLikedPostIds(viewerId, postIds),
        this.bookmarkRepo.getBookmarkedPostIds(viewerId, postIds),
      ]);

    const purchasedSet = new Set(purchasedIds);
    const bundleSet = new Set(bundlePurchasedIds);
    const likedSet = new Set(likedIds);
    const bookmarkedSet = new Set(bookmarkedIds);

    for (const post of formattedPosts) {
      if (post.accessLevel === 'free') {
        post.hasAccess = true;
      } else if (post.accessLevel === 'subscribers') {
        post.hasAccess = isSubscribed || bundleSet.has(post.id);
      } else if (post.accessLevel === 'ppv') {
        post.hasAccess = isSubscribed || purchasedSet.has(post.id) || bundleSet.has(post.id);
      } else {
        post.hasAccess = false;
      }

      post.isLiked = likedSet.has(post.id);
      post.isBookmarked = bookmarkedSet.has(post.id);
    }

    this.stripLockedMedia(formattedPosts);

    return {
      creatorId: creator.id,
      feed: {
        posts: formattedPosts,
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      },
    };
  }

  private formatPost(
    post: NonNullable<Awaited<ReturnType<PostRepository['findByCreator']>>[0]>
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
        handle: user.username ?? '',
        displayName: user.displayName ?? '',
        avatarUrl: user.avatarUrl ?? null,
        isVerified: creator.isVerified,
      },
      media: post.media.map((m) => ({
        id: m.id,
        mediaType: m.mediaType,
        originalUrl: m.originalUrl,
        processedUrl: m.processedUrl ?? null,
        thumbnailUrl: m.thumbnailUrl ?? null,
        previewUrl: m.previewUrl ?? null,
        width: m.width,
        height: m.height,
        duration: m.duration,
        processingStatus: m.processingStatus,
        sortOrder: m.sortOrder,
      })),
      tags: (post.postTags ?? []).map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
      hasAccess: false,
      isLiked: false,
      isBookmarked: false,
    };
  }

  private stripLockedMedia(posts: PostWithCreator[]) {
    for (const post of posts) {
      if (!post.hasAccess) {
        for (const media of post.media) {
          media.originalUrl = 'locked';
          media.processedUrl = null;
        }
      }
    }
  }
}
