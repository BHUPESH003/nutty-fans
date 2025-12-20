'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { PostCard } from '@/components/posts/PostCard';
import { apiClient } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

export function ExploreFeed() {
  const [posts, setPosts] = useState<PostWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = async (reset = false) => {
    try {
      setLoading(true);
      const result = await apiClient.explore.getFeed(reset ? undefined : cursor || undefined);

      if (reset) {
        setPosts(result.posts || []);
      } else {
        setPosts((prev) => [...prev, ...(result.posts || [])]);
      }

      setCursor(result.nextCursor || null);
      setHasMore(result.hasMore || false);
    } catch (error) {
      console.error('Failed to load explore feed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = () => {
    if (!loading && hasMore && cursor) {
      void loadFeed(false);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No posts to explore yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasMore && (
        <div className="pt-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
