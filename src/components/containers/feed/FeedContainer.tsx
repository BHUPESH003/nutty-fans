'use client';

import { Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

interface FeedContainerProps {
  feedType?: 'for-you' | 'following';
}

export const FeedContainer = ({ feedType = 'for-you' }: FeedContainerProps) => {
  const [posts, setPosts] = useState<PostWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchFeed = useCallback(
    async (cursor?: string) => {
      try {
        const data = await apiClient.content.getFeed({ cursor, limit: 10, type: feedType });

        if (cursor) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error('Failed to fetch feed:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [feedType]
  );

  useEffect(() => {
    setPosts([]);
    setIsLoading(true);
    setNextCursor(null);
    setHasMore(false);
    void fetchFeed();
  }, [feedType, fetchFeed]);

  const handleLoadMore = () => {
    if (nextCursor) {
      setIsLoadingMore(true);
      void fetchFeed(nextCursor);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {posts.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>No posts yet. Be the first to post!</p>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
