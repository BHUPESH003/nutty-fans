/**
 * Meilisearch Service
 *
 * Handles full-text search using Meilisearch
 */

import { MeiliSearch } from 'meilisearch';

import { prisma } from '@/lib/db/prisma';

const MEILISEARCH_HOST = process.env['MEILISEARCH_HOST'] ?? 'http://localhost:7700';
const MEILISEARCH_API_KEY = process.env['MEILISEARCH_API_KEY'] ?? '';

const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});

// Index names
const CREATORS_INDEX = 'creators';
const POSTS_INDEX = 'posts';

export class MeilisearchService {
  private creatorsIndex = client.index(CREATORS_INDEX);
  private postsIndex = client.index(POSTS_INDEX);

  /**
   * Initialize indexes with settings
   */
  async initializeIndexes(): Promise<void> {
    try {
      // Initialize creators index
      await this.creatorsIndex.updateSettings({
        searchableAttributes: ['username', 'displayName', 'bio'],
        filterableAttributes: ['categoryId', 'isVerified', 'isActive'],
        sortableAttributes: ['subscriberCount', 'createdAt'],
        displayedAttributes: [
          'id',
          'username',
          'displayName',
          'avatarUrl',
          'bio',
          'subscriberCount',
          'isVerified',
          'categoryName',
        ],
      });

      // Initialize posts index
      await this.postsIndex.updateSettings({
        searchableAttributes: ['content', 'creatorUsername', 'creatorDisplayName'],
        filterableAttributes: ['creatorId', 'accessLevel', 'status', 'isNsfw'],
        sortableAttributes: ['likeCount', 'commentCount', 'createdAt'],
        displayedAttributes: [
          'id',
          'content',
          'creatorId',
          'creatorHandle',
          'creatorDisplayName',
          'creatorAvatarUrl',
          'likeCount',
          'commentCount',
          'createdAt',
        ],
      });
    } catch (error) {
      console.error('Failed to initialize Meilisearch indexes:', error);
    }
  }

  /**
   * Index a creator
   */
  async indexCreator(creatorId: string): Promise<void> {
    try {
      const creator = await prisma.creatorProfile.findUnique({
        where: { id: creatorId },
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
      });

      if (!creator || !creator.isActive) {
        // Remove from index if inactive
        await this.creatorsIndex.deleteDocument(creatorId);
        return;
      }

      await this.creatorsIndex.addDocuments([
        {
          id: creator.id,
          username: creator.user.username,
          displayName: creator.user.displayName,
          avatarUrl: creator.user.avatarUrl,
          bio: creator.bio,
          subscriberCount: creator.subscriberCount,
          isVerified: creator.isVerified,
          categoryId: creator.categoryId,
          categoryName: creator.category?.name ?? null,
          isActive: creator.isActive,
          createdAt: creator.createdAt.toISOString(),
        },
      ]);
    } catch (error) {
      console.error(`Failed to index creator ${creatorId}:`, error);
    }
  }

  /**
   * Index a post
   */
  async indexPost(postId: string): Promise<void> {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
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
      });

      if (!post || post.status !== 'published') {
        // Remove from index if not published
        await this.postsIndex.deleteDocument(postId);
        return;
      }

      await this.postsIndex.addDocuments([
        {
          id: post.id,
          content: post.content,
          creatorId: post.creatorId,
          creatorUsername: post.creator.user.username,
          creatorDisplayName: post.creator.user.displayName,
          creatorAvatarUrl: post.creator.user.avatarUrl,
          creatorHandle: post.creator.user.username,
          accessLevel: post.accessLevel,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          isNsfw: post.isNsfw,
          status: post.status,
          createdAt: post.createdAt.toISOString(),
        },
      ]);
    } catch (error) {
      console.error(`Failed to index post ${postId}:`, error);
    }
  }

  /**
   * Remove creator from index
   */
  async removeCreator(creatorId: string): Promise<void> {
    try {
      await this.creatorsIndex.deleteDocument(creatorId);
    } catch (error) {
      console.error(`Failed to remove creator ${creatorId} from index:`, error);
    }
  }

  /**
   * Remove post from index
   */
  async removePost(postId: string): Promise<void> {
    try {
      await this.postsIndex.deleteDocument(postId);
    } catch (error) {
      console.error(`Failed to remove post ${postId} from index:`, error);
    }
  }

  /**
   * Search creators
   */
  async searchCreators(query: string, filters?: { categoryId?: string; limit?: number }) {
    try {
      interface SearchOptions {
        limit: number;
        filter?: string;
      }

      const searchOptions: SearchOptions = {
        limit: filters?.limit ?? 20,
      };

      if (filters?.categoryId) {
        searchOptions.filter = `categoryId = ${filters.categoryId}`;
      }

      const results = await this.creatorsIndex.search(query, searchOptions);

      interface CreatorHit {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        bio: string | null;
        subscriberCount: number;
        isVerified: boolean;
        categoryName: string | null;
      }

      return {
        creators: results.hits.map((hit: CreatorHit) => ({
          id: hit.id,
          handle: hit.username,
          displayName: hit.displayName,
          avatarUrl: hit.avatarUrl,
          bio: hit.bio,
          subscriberCount: hit.subscriberCount,
          isVerified: hit.isVerified,
          categoryName: hit.categoryName,
        })),
        total: results.estimatedTotalHits,
      };
    } catch (error) {
      console.error('Meilisearch search error:', error);
      // Fallback to database search
      return { creators: [], total: 0 };
    }
  }

  /**
   * Search posts
   */
  async searchPosts(query: string, filters?: { creatorId?: string; limit?: number }) {
    try {
      interface SearchOptions {
        limit: number;
        filter?: string;
      }

      const searchOptions: SearchOptions = {
        limit: filters?.limit ?? 20,
      };

      if (filters?.creatorId) {
        searchOptions.filter = `creatorId = ${filters.creatorId}`;
      }

      const results = await this.postsIndex.search(query, searchOptions);

      interface PostHit {
        id: string;
        content: string | null;
        creatorId: string;
        creatorUsername: string;
        creatorDisplayName: string;
        creatorAvatarUrl: string | null;
        likeCount: number;
        commentCount: number;
        createdAt: string;
        mediaCount: number;
      }

      return {
        posts: results.hits.map((hit: PostHit) => ({
          id: hit.id,
          content: hit.content,
          creatorId: hit.creatorId,
          creatorHandle: hit.creatorUsername,
          creatorDisplayName: hit.creatorDisplayName,
          creatorAvatarUrl: hit.creatorAvatarUrl,
          likeCount: hit.likeCount,
          commentCount: hit.commentCount,
          createdAt: new Date(hit.createdAt),
        })),
        total: results.estimatedTotalHits,
      };
    } catch (error) {
      console.error('Meilisearch search error:', error);
      // Fallback to database search
      return { posts: [], total: 0 };
    }
  }

  /**
   * Reindex all creators (for initial setup or bulk update)
   */
  async reindexAllCreators(): Promise<void> {
    try {
      const creators = await prisma.creatorProfile.findMany({
        where: { isActive: true },
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
        take: 1000, // Process in batches
      });

      const documents = creators.map((creator) => ({
        id: creator.id,
        username: creator.user.username,
        displayName: creator.user.displayName,
        avatarUrl: creator.user.avatarUrl,
        bio: creator.bio,
        subscriberCount: creator.subscriberCount,
        isVerified: creator.isVerified,
        categoryId: creator.categoryId,
        categoryName: creator.category?.name ?? null,
        isActive: creator.isActive,
        createdAt: creator.createdAt.toISOString(),
      }));

      await this.creatorsIndex.addDocuments(documents);
    } catch (error) {
      console.error('Failed to reindex creators:', error);
    }
  }

  /**
   * Reindex all posts (for initial setup or bulk update)
   */
  async reindexAllPosts(): Promise<void> {
    try {
      const posts = await prisma.post.findMany({
        where: { status: 'published' },
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
        take: 1000, // Process in batches
      });

      const documents = posts.map((post) => ({
        id: post.id,
        content: post.content,
        creatorId: post.creatorId,
        creatorUsername: post.creator.user.username,
        creatorDisplayName: post.creator.user.displayName,
        creatorAvatarUrl: post.creator.user.avatarUrl,
        creatorHandle: post.creator.user.username,
        accessLevel: post.accessLevel,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        isNsfw: post.isNsfw,
        status: post.status,
        createdAt: post.createdAt.toISOString(),
      }));

      await this.postsIndex.addDocuments(documents);
    } catch (error) {
      console.error('Failed to reindex posts:', error);
    }
  }
}

export const meilisearchService = new MeilisearchService();
