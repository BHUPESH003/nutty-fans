import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import type { PostFilters } from '@/types/content';

export class PostRepository {
  /**
   * Create a new post
   */
  async create(data: {
    creatorId: string;
    content?: string;
    postType?: 'post' | 'story' | 'reel';
    accessLevel?: 'free' | 'subscribers' | 'ppv';
    ppvPrice?: number;
    isNsfw?: boolean;
    commentsEnabled?: boolean;
    scheduledAt?: Date;
    expiresAt?: Date;
    status?: 'draft' | 'scheduled' | 'published';
  }) {
    return prisma.post.create({
      data: {
        creatorId: data.creatorId,
        content: data.content ?? null,
        postType: data.postType ?? 'post',
        accessLevel: data.accessLevel ?? 'subscribers',
        ppvPrice: data.ppvPrice ?? null,
        isNsfw: data.isNsfw ?? false,
        commentsEnabled: data.commentsEnabled ?? true,
        scheduledAt: data.scheduledAt ?? null,
        expiresAt: data.expiresAt ?? null,
        status: data.status ?? 'draft',
        publishedAt: data.status === 'published' ? new Date() : null,
      },
      include: {
        media: true,
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find post by ID with relations
   */
  async findById(id: string) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find posts by creator with filters
   */
  async findByCreator(creatorId: string, filters: PostFilters = {}) {
    const { status, postType, cursor, limit = 20 } = filters;

    const where: Prisma.PostWhereInput = {
      creatorId,
      ...(status && { status }),
      ...(postType && { postType }),
    };

    return prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Update post
   */
  async update(id: string, data: Prisma.PostUpdateInput) {
    return prisma.post.update({
      where: { id },
      data,
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  /**
   * Delete post
   */
  async delete(id: string) {
    return prisma.post.delete({
      where: { id },
    });
  }

  /**
   * Publish a draft post
   */
  async publish(id: string) {
    return prisma.post.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }

  /**
   * Schedule a post
   */
  async schedule(id: string, scheduledAt: Date) {
    return prisma.post.update({
      where: { id },
      data: {
        status: 'scheduled',
        scheduledAt,
      },
    });
  }

  /**
   * Attach media to post
   */
  async attachMedia(postId: string, mediaIds: string[]) {
    return prisma.media.updateMany({
      where: { id: { in: mediaIds } },
      data: { postId },
    });
  }

  /**
   * Increment counters
   */
  async incrementLikeCount(id: string, delta: number) {
    return prisma.post.update({
      where: { id },
      data: { likeCount: { increment: delta } },
    });
  }

  async incrementCommentCount(id: string, delta: number) {
    return prisma.post.update({
      where: { id },
      data: { commentCount: { increment: delta } },
    });
  }

  async incrementViewCount(id: string) {
    return prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Get subscribed feed for user
   */
  async getSubscribedFeed(userId: string, cursor?: string, limit = 20) {
    const posts = await prisma.post.findMany({
      where: {
        status: 'published',
        publishedAt: { lte: new Date() },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        creator: {
          subscriptions: {
            some: {
              userId,
              status: 'active',
            },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return posts;
  }

  /**
   * Get public posts for explore feed
   * Only includes FREE and PPV content - subscriber-only content requires subscription
   * PPV content shows in explore but media URLs are stripped until purchased
   */
  async getExploreFeed(cursor?: string, limit = 20) {
    return prisma.post.findMany({
      where: {
        status: 'published',
        // Only free and PPV - subscriber content is exclusive to subscribers
        accessLevel: { in: ['free', 'ppv'] },
        publishedAt: { lte: new Date() },
        // Include both posts and reels (exclude stories as they expire)
        postType: { in: ['post', 'reel'] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get creator's public posts
   */
  async getCreatorPublicPosts(creatorId: string, cursor?: string, limit = 20) {
    return prisma.post.findMany({
      where: {
        creatorId,
        status: 'published',
        accessLevel: 'free',
        publishedAt: { lte: new Date() },
      },
      orderBy: { publishedAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  /**
   * Count published posts by creator
   */
  async countPublishedPostsByCreator(creatorId: string): Promise<number> {
    return prisma.post.count({
      where: {
        creatorId,
        status: 'published',
      },
    });
  }

  /**
   * Count published posts by user (via creator profile)
   */
  async countPublishedPostsByUser(userId: string): Promise<number> {
    return prisma.post.count({
      where: {
        creator: {
          userId,
        },
        status: 'published',
      },
    });
  }

  /**
   * Get reels feed - videos and reel-type posts ordered by engagement
   */
  async getReelsFeed(cursor?: string, limit = 10) {
    return prisma.post.findMany({
      where: {
        status: 'published',
        publishedAt: { lte: new Date() },
        OR: [
          { postType: 'reel' },
          {
            media: {
              some: {
                mediaType: 'video',
              },
            },
          },
        ],
      },
      orderBy: [{ likeCount: 'desc' }, { viewCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }
}
