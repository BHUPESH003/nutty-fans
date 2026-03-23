'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/content';

import { getMediaAspectRatio } from './mediaAspect';

interface MediaCarouselProps {
  media: MediaItem[];

  onSlideChange?: (slideIndex: number) => void;
  className?: string;
}

export function MediaCarousel({ media, onSlideChange, className }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goToSlide = useCallback(
    (index: number) => {
      const newIndex = Math.max(0, Math.min(index, media.length - 1));
      setCurrentIndex(newIndex);
      onSlideChange?.(newIndex);
    },
    [media.length, onSlideChange]
  );

  const goToPrevious = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide]);

  const goToNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [currentIndex, goToSlide]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    const container = containerRef.current;
    container?.addEventListener('keydown', handleKeyDown);
    return () => container?.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  if (media.length === 0) return null;

  const firstMedia = media[0];
  const aspectRatio = getMediaAspectRatio(firstMedia, 'feed');

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden bg-black/10', className)}
      style={{ aspectRatio }}
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {media.map((item) => {
          const mediaUrl = item.processedUrl || item.originalUrl;
          const isValidUrl = mediaUrl && mediaUrl !== 'locked' && mediaUrl.length > 0;

          return (
            <div key={item.id} className="h-full w-full flex-shrink-0">
              {!isValidUrl ? (
                <div className="flex h-full w-full items-center justify-center bg-muted/50">
                  <span className="text-sm text-muted-foreground">Media unavailable</span>
                </div>
              ) : item.mediaType === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl}
                  alt="Post media"
                  className="h-full w-full object-cover"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <video
                  src={mediaUrl}
                  poster={item.thumbnailUrl || undefined}
                  className="h-full w-full object-cover"
                  controls
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows (desktop) */}
      {media.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 sm:opacity-100"
              aria-label="Previous slide"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
          )}
          {currentIndex < media.length - 1 && (
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100 sm:opacity-100"
              aria-label="Next slide"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          )}
        </>
      )}

      {/* Pagination Dots */}
      {media.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {media.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter (top right) */}
      {media.length > 1 && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {currentIndex + 1}/{media.length}
        </div>
      )}
    </div>
  );
}
