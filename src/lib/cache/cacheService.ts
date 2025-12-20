/**
 * Cache Service
 *
 * Provides caching utilities for API responses and frequently accessed data.
 * Uses in-memory cache for development, can be extended to use Redis in production.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 60 * 1000; // 1 minute default

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Delete all cached values matching a pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get or set cached value (cache-aside pattern)
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  /**
   * Invalidate cache for a specific resource
   */
  invalidateResource(type: string, id: string): void {
    this.deletePattern(`^${type}:${id}`);
    this.deletePattern(`^${type}:${id}:.*`);
  }
}

// Singleton instance
export const cacheService = new CacheService();

/**
 * Cache key generators
 */
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:profile:${id}`,
  creator: (id: string) => `creator:${id}`,
  creatorProfile: (id: string) => `creator:profile:${id}`,
  post: (id: string) => `post:${id}`,
  postFeed: (userId: string, cursor?: string) => `feed:${userId}:${cursor ?? 'initial'}`,
  exploreFeed: (cursor?: string) => `explore:feed:${cursor ?? 'initial'}`,
  trendingCreators: () => 'trending:creators',
  trendingPosts: () => 'trending:posts',
  subscription: (userId: string, creatorId: string) => `subscription:${userId}:${creatorId}`,
  walletBalance: (userId: string) => `wallet:balance:${userId}`,
  unreadNotifications: (userId: string) => `notifications:unread:${userId}`,
};
