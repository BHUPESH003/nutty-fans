'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import { ReelCard } from '@/components/reels/ReelCard';
import { apiClient } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

interface ReelsViewProps {
  initialPosts?: PostWithCreator[];
}

export function ReelsView({ initialPosts = [] }: ReelsViewProps) {
  const [reels, setReels] = useState<PostWithCreator[]>(initialPosts);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(initialPosts.length === 0);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRefs = useRef<Map<number, IntersectionObserver>>(new Map());

  const fetchReels = useCallback(async (cursorValue?: string | null) => {
    try {
      setIsLoading(true);
      // Use explore feed with video filter for now
      const response = await apiClient.explore.getFeed(cursorValue || undefined, 10);
      const videoPosts = (response.posts || []).filter(
        (post: PostWithCreator) =>
          post.postType === 'reel' || post.media.some((m) => m.mediaType === 'video')
      );

      setReels((prev) => (cursorValue ? [...prev, ...videoPosts] : videoPosts));
      setCursor(response.nextCursor || null);
      setHasMore(!!response.nextCursor);
    } catch (error) {
      console.error('Failed to fetch reels:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch reels on mount if no initial posts
  useEffect(() => {
    if (initialPosts.length === 0) {
      void fetchReels();
    }
  }, [fetchReels, initialPosts.length]);

  // Intersection Observer for active reel detection
  const observeReel = useCallback(
    (element: HTMLElement | null, index: number) => {
      if (!element) return;

      // Clean up existing observer for this index
      const existingObserver = observerRefs.current.get(index);
      if (existingObserver) {
        existingObserver.disconnect();
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              setActiveIndex(index);

              // Load more when approaching end
              if (index >= reels.length - 2 && hasMore && !isLoading) {
                void fetchReels(cursor);
              }
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(element);
      observerRefs.current.set(index, observer);

      return () => {
        observer.disconnect();
        observerRefs.current.delete(index);
      };
    },
    [reels.length, hasMore, isLoading, cursor, fetchReels]
  );

  // Navigation
  const goToNext = useCallback(() => {
    if (activeIndex < reels.length - 1) {
      const container = containerRef.current;
      if (container) {
        container.children[activeIndex + 1]?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeIndex, reels.length]);

  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      const container = containerRef.current;
      if (container) {
        container.children[activeIndex - 1]?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [activeIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  const handleUnlock = async (postId: string) => {
    try {
      await apiClient.payments.unlockPpv(postId);
      // Refresh the specific reel
      setReels((prev) => prev.map((r) => (r.id === postId ? { ...r, hasAccess: true } : r)));
    } catch (error) {
      console.error('Failed to unlock:', error);
    }
  };

  const handleLike = (postId: string) => {
    // Optimistic update
    setReels((prev) =>
      prev.map((r) =>
        r.id === postId
          ? { ...r, isLiked: !r.isLiked, likeCount: r.isLiked ? r.likeCount - 1 : r.likeCount + 1 }
          : r
      )
    );
    // TODO: Call API
  };

  const handleBookmark = (postId: string) => {
    setReels((prev) =>
      prev.map((r) => (r.id === postId ? { ...r, isBookmarked: !r.isBookmarked } : r))
    );
    // TODO: Call API
  };

  if (isLoading && reels.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <span className="material-symbols-outlined animate-spin text-5xl text-white">
          progress_activity
        </span>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <p className="text-lg">No reels available</p>
        <p className="mt-2 text-sm text-white/60">Check back later for new content</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Navigation hints (desktop) */}
      <div className="pointer-events-none absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
        <button
          onClick={goToPrevious}
          disabled={activeIndex === 0}
          className={`pointer-events-auto rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-opacity ${
            activeIndex === 0 ? 'opacity-30' : 'opacity-100 hover:bg-white/20'
          }`}
        >
          <span className="material-symbols-outlined text-[28px]">keyboard_arrow_up</span>
        </button>
        <button
          onClick={goToNext}
          disabled={activeIndex === reels.length - 1}
          className={`pointer-events-auto rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-opacity ${
            activeIndex === reels.length - 1 ? 'opacity-30' : 'opacity-100 hover:bg-white/20'
          }`}
        >
          <span className="material-symbols-outlined text-[28px]">keyboard_arrow_down</span>
        </button>
      </div>

      {/* Progress indicators */}
      <div className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-1 lg:flex">
        {reels.slice(0, 10).map((_, index) => (
          <div
            key={index}
            className={`h-1 w-1 rounded-full transition-all ${
              index === activeIndex ? 'h-6 bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Reels container with snap scrolling */}
      <div
        ref={containerRef}
        className="scrollbar-hide h-full snap-y snap-mandatory overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            ref={(el) => observeReel(el, index)}
            className="h-screen w-full snap-start snap-always"
          >
            <ReelCard
              post={reel}
              isActive={index === activeIndex}
              onUnlock={() => void handleUnlock(reel.id)}
              onLike={() => handleLike(reel.id)}
              onBookmark={() => handleBookmark(reel.id)}
            />
          </div>
        ))}

        {/* Loading indicator at bottom */}
        {isLoading && reels.length > 0 && (
          <div className="flex h-20 items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-[28px] text-white">
              progress_activity
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
