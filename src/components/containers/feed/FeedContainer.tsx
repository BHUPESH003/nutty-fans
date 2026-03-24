'use client';

import { type ReactNode, useState, useEffect, useCallback } from 'react';

import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient, ApiError } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

interface FeedContainerProps {
  feedType?: 'for-you' | 'following';
  inlineRail?: ReactNode;
}

export const FeedContainer = ({ feedType = 'for-you', inlineRail }: FeedContainerProps) => {
  const { toast } = useToast();
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

  const handleUnlock = useCallback(
    async (postId: string) => {
      try {
        await apiClient.payments.unlockPpv(postId);
        // Refresh feed to update access status
        await fetchFeed();
      } catch (error: unknown) {
        console.error('Failed to unlock post in FeedContainer:', error);
        // Extract error message and status
        let errorMessage = 'Something went wrong. Please try again.';
        let errorStatus: number | undefined;

        if (error instanceof ApiError) {
          errorMessage = error.message;
          errorStatus = error.status;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error && typeof error === 'object' && 'message' in error) {
          errorMessage = String((error as { message: unknown }).message);
          if ('status' in error) {
            errorStatus = Number((error as { status: unknown }).status);
          }
        }

        // Handle insufficient balance error (402 status)
        const isInsufficientBalance =
          errorStatus === 402 || errorMessage.toLowerCase().includes('insufficient');

        if (isInsufficientBalance) {
          toast({
            title: 'Insufficient Balance',
            description: errorMessage || 'Please add funds to your wallet to unlock this content.',
            variant: 'destructive',
          });
        } else {
          // Show generic error
          toast({
            title: 'Failed to Unlock',
            description: errorMessage,
            variant: 'destructive',
          });
        }

        // Re-throw error so PostCard can also handle it if needed
        throw error;
      }
    },
    [fetchFeed, toast]
  );

  const handleSubscribe = useCallback(
    async (creatorId: string) => {
      try {
        await apiClient.payments.subscribe(creatorId, 'monthly');
        // Refresh feed to update subscription status
        await fetchFeed();
      } catch (error) {
        console.error('Failed to subscribe:', error);
        throw error;
      }
    },
    [fetchFeed]
  );

  const handleLike = useCallback(
    async (postId: string) => {
      try {
        await apiClient.content.toggleLike(postId);
        // Update local state optimistically - PostInteractions handles this, but we refresh to sync
        await fetchFeed();
      } catch (error) {
        console.error('Failed to toggle like:', error);
        // PostInteractions will handle error state
      }
    },
    [fetchFeed]
  );

  const handleBookmark = useCallback(
    async (postId: string) => {
      try {
        await apiClient.content.toggleBookmark(postId);
        // Update local state optimistically - PostInteractions handles this, but we refresh to sync
        await fetchFeed();
      } catch (error) {
        console.error('Failed to toggle bookmark:', error);
        // PostInteractions will handle error state
      }
    },
    [fetchFeed]
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <div className="space-y-6">
        {posts.map((post, index) => (
          <div key={post.id} className="space-y-6">
            <PostCard
              post={post}
              onUnlock={() => handleUnlock(post.id)}
              onSubscribe={() => handleSubscribe(post.creator.id)}
              onLike={() => handleLike(post.id)}
              onBookmark={() => handleBookmark(post.id)}
            />
            {inlineRail && index === 3 ? <div className="xl:hidden">{inlineRail}</div> : null}
          </div>
        ))}

        {inlineRail && posts.length > 0 && posts.length < 4 ? (
          <div className="xl:hidden">{inlineRail}</div>
        ) : null}

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
                  <span className="material-symbols-outlined mr-2 animate-spin text-[18px]">
                    progress_activity
                  </span>
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
