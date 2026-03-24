import { cacheService, cacheKeys } from '@/lib/cache/cacheService';
import { prisma } from '@/lib/db/prisma';

import { meilisearchService } from './meilisearchService';

export interface SearchResult {
  creators: Array<{
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    subscriberCount: number;
    isVerified: boolean;
    categoryName: string | null;
  }>;
  posts: Array<{
    id: string;
    content: string | null;
    creatorId: string;
    creatorHandle: string;
    creatorDisplayName: string;
    creatorAvatarUrl: string | null;
    likeCount: number;
    commentCount: number;
    createdAt: Date;
    mediaCount: number;
  }>;
}

export class SearchService {
  async search(query: string, limit = 20): Promise<SearchResult> {
    if (!query || query.trim().length < 2) {
      return { creators: [], posts: [] };
    }

    // Try Meilisearch first, fallback to database search
    try {
      const [creatorsResult, postsResult] = await Promise.all([
        meilisearchService.searchCreators(query, { limit }),
        meilisearchService.searchPosts(query, { limit }),
      ]);

      const creators = creatorsResult.creators ?? [];
      const posts = postsResult.posts ?? [];

      // If search index is empty/outdated, use DB fallback instead of returning empty early.
      if (creators.length > 0 || posts.length > 0) {
        return { creators, posts };
      }
    } catch (error) {
      console.error('Meilisearch search failed, falling back to database:', error);
      // Fallback to database search
    }

    // Search creators
    const creators = await prisma.creatorProfile.findMany({
      where: {
        user: {
          status: 'active',
          OR: [
            { username: { contains: query.trim(), mode: 'insensitive' } },
            { displayName: { contains: query.trim(), mode: 'insensitive' } },
          ],
        },
      },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        totalSubscribers: 'desc',
      },
    });

    // Search posts (public posts only)
    const posts = await prisma.post.findMany({
      where: {
        status: 'published',
        accessLevel: 'free',
        OR: [
          { content: { contains: query.trim(), mode: 'insensitive' } },
          {
            creator: {
              user: {
                OR: [
                  { username: { contains: query.trim(), mode: 'insensitive' } },
                  { displayName: { contains: query.trim(), mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      },
      take: limit,
      include: {
        creator: {
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        media: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      creators: creators.map((c) => ({
        id: c.id,
        handle: c.user.username ?? 'user',
        displayName: c.user.displayName ?? 'User',
        avatarUrl: c.user.avatarUrl,
        bio: c.bio,
        subscriberCount: c.totalSubscribers,
        isVerified: c.isVerified,
        categoryName: c.category?.name ?? null,
      })),
      posts: posts.map((p) => ({
        id: p.id,
        content: p.content,
        creatorId: p.creatorId,
        creatorHandle: p.creator.user.username ?? 'user',
        creatorDisplayName: p.creator.user.displayName ?? 'User',
        creatorAvatarUrl: p.creator.user.avatarUrl,
        likeCount: p.likeCount,
        commentCount: p.commentCount,
        createdAt: p.createdAt,
        mediaCount: p.media.length,
      })),
    };
  }

  async searchCreators(query: string, categoryId?: string, limit = 20) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Try Meilisearch first, fallback to database search
    try {
      const result = await meilisearchService.searchCreators(query, { categoryId, limit });
      if ((result.creators ?? []).length > 0) {
        return result.creators;
      }
    } catch (error) {
      console.error('Meilisearch search failed, falling back to database:', error);
      // Fallback to database search
    }

    const creators = await prisma.creatorProfile.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        user: {
          status: 'active',
          OR: [
            { username: { contains: query.trim(), mode: 'insensitive' } },
            { displayName: { contains: query.trim(), mode: 'insensitive' } },
          ],
        },
      },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        totalSubscribers: 'desc',
      },
    });

    return creators.map((c) => ({
      id: c.id,
      handle: c.user.username ?? 'user',
      displayName: c.user.displayName ?? 'User',
      avatarUrl: c.user.avatarUrl,
      bio: c.bio,
      subscriberCount: c.totalSubscribers,
      isVerified: c.isVerified,
      categoryName: c.category?.name ?? null,
    }));
  }

  async getTrendingCreators(limit = 10) {
    // Cache trending creators for 5 minutes
    const cacheKey = `${cacheKeys.trendingCreators()}:${limit}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        // Simple trending algorithm: creators with most subscribers in last 30 days
        // In production, this would consider growth rate, engagement, etc.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const creators = await prisma.creatorProfile.findMany({
          where: {
            isVerified: true, // Only verified creators in trending
            user: {
              status: 'active',
            },
          },
          take: limit,
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            totalSubscribers: 'desc',
          },
        });

        return creators.map((c) => ({
          id: c.id,
          handle: c.user.username ?? 'user',
          displayName: c.user.displayName ?? 'User',
          avatarUrl: c.user.avatarUrl,
          bio: c.bio,
          subscriberCount: c.totalSubscribers,
          isVerified: c.isVerified,
          categoryName: c.category?.name ?? null,
        }));
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  async getTrendingPosts(limit = 20) {
    // Cache trending posts for 2 minutes
    const cacheKey = `${cacheKeys.trendingPosts()}:${limit}`;

    return cacheService.getOrSet(
      cacheKey,
      async () => {
        // Simple trending algorithm: posts with most likes in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const posts = await prisma.post.findMany({
          where: {
            status: 'published',
            accessLevel: 'free',
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
          take: limit,
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: {
            likeCount: 'desc',
          },
        });

        return posts.map((p) => ({
          id: p.id,
          content: p.content,
          creatorId: p.creatorId,
          creatorHandle: p.creator.user.username ?? 'user',
          creatorDisplayName: p.creator.user.displayName ?? 'User',
          creatorAvatarUrl: p.creator.user.avatarUrl,
          likeCount: p.likeCount,
          commentCount: p.commentCount,
          createdAt: p.createdAt,
        }));
      },
      2 * 60 * 1000 // 2 minutes cache
    );
  }
}
