'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { MediaRenderer } from '@/components/media/MediaRenderer';
import { apiClient } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

interface ExploreFeedProps {
  categorySlug?: string;
}

export function ExploreFeed({ categorySlug }: ExploreFeedProps) {
  const [posts, setPosts] = useState<PostWithCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = async (reset = false) => {
    try {
      setLoading(true);
      const result = await apiClient.explore.getFeed(
        reset ? undefined : cursor || undefined,
        undefined,
        categorySlug || undefined
      );

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
  }, [categorySlug]);

  const handleLoadMore = () => {
    if (!loading && hasMore && cursor) {
      void loadFeed(false);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-symbols-outlined animate-spin text-[40px] text-on-surface-variant">
          progress_activity
        </span>
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
    <div className="mx-auto max-w-6xl">
      {/* Instagram-style grid of media thumbnails */}
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {posts.map((post) => {
          const primaryMedia = post.media?.[0];
          if (!primaryMedia) return null;

          return (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="group relative aspect-square overflow-hidden bg-surface-container-low transition-opacity hover:opacity-80"
            >
              <MediaRenderer
                media={post.media || []}
                variant="feed"
                isLocked={!post.hasAccess && post.accessLevel !== 'free'}
                accessLevel={post.accessLevel}
                ppvPrice={post.ppvPrice}
                className="!static"
              />
              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </Link>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="pt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="rounded-md border border-input bg-background px-6 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined mr-2 inline animate-spin text-[18px]">
                  progress_activity
                </span>
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
