'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';

import { cn } from '@/lib/utils';

interface PostInteractionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tipEnabled?: boolean;
  variant?: 'feed' | 'reels';
  onLike?: () => void;
  onBookmark?: () => void;
  onTip?: () => void;
  onShare?: () => void;
  className?: string;
}

export function PostInteractions({
  postId,
  likeCount,
  commentCount,
  isLiked = false,
  isBookmarked = false,
  tipEnabled = true,
  variant = 'feed',
  onLike,
  onBookmark,
  onTip,
  onShare,
  className,
}: PostInteractionsProps) {
  const [optimisticLiked, setOptimisticLiked] = useState(isLiked);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);
  const [optimisticBookmarked, setOptimisticBookmarked] = useState(isBookmarked);

  const handleLike = () => {
    // Optimistic update
    setOptimisticLiked(!optimisticLiked);
    setOptimisticCount((prev) => (optimisticLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  const handleBookmark = () => {
    setOptimisticBookmarked(!optimisticBookmarked);
    onBookmark?.();
  };

  // Reels variant - vertical stack on right side
  if (variant === 'reels') {
    return (
      <div className={cn('flex flex-col items-center gap-5', className)}>
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          aria-label={optimisticLiked ? 'Unlike' : 'Like'}
        >
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-transform active:scale-90',
              optimisticLiked && 'bg-primary/20'
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined text-[28px]',
                optimisticLiked ? 'text-primary' : 'text-white'
              )}
              style={
                optimisticLiked
                  ? ({
                      fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    } as CSSProperties)
                  : undefined
              }
            >
              favorite
            </span>
          </div>
          <span className="text-xs font-medium text-white">{optimisticCount}</span>
        </button>

        {/* Comment */}
        <Link
          href={`/post/${postId}`}
          className="flex flex-col items-center gap-1"
          aria-label="View comments"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[28px] text-white">chat_bubble</span>
          </div>
          <span className="text-xs font-medium text-white">{commentCount}</span>
        </Link>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className="flex flex-col items-center gap-1"
          aria-label={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-transform active:scale-90',
              optimisticBookmarked && 'bg-primary/20'
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined text-[28px]',
                optimisticBookmarked ? 'text-primary' : 'text-white'
              )}
              style={
                optimisticBookmarked
                  ? ({
                      fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                    } as CSSProperties)
                  : undefined
              }
            >
              bookmark
            </span>
          </div>
        </button>

        {/* Tip */}
        {tipEnabled && onTip && (
          <button
            onClick={onTip}
            className="flex flex-col items-center gap-1"
            aria-label="Send tip"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-transform hover:bg-green-500/20 active:scale-90">
              <span className="material-symbols-outlined text-[28px] text-white">toll</span>
            </div>
          </button>
        )}

        {/* Share */}
        {onShare && (
          <button onClick={onShare} className="flex flex-col items-center gap-1" aria-label="Share">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-transform active:scale-90">
              <span className="material-symbols-outlined text-[28px] text-white">share</span>
            </div>
          </button>
        )}
      </div>
    );
  }

  // Feed variant - horizontal bar
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-1">
        {/* Like */}
        <button
          onClick={handleLike}
          className={cn(
            'group flex items-center gap-1 rounded-full px-2 py-2 transition-colors hover:bg-surface-container-low',
            optimisticLiked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
          )}
          aria-label={optimisticLiked ? 'Unlike' : 'Like'}
        >
          <span
            className="material-symbols-outlined text-[20px] transition-transform group-active:scale-95"
            style={
              optimisticLiked
                ? ({
                    fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  } as CSSProperties)
                : undefined
            }
          >
            favorite
          </span>
          <span className="text-sm font-medium">{optimisticCount}</span>
        </button>

        {/* Comment */}
        <Link
          href={`/post/${postId}`}
          className="group flex items-center gap-1 rounded-full px-2 py-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          aria-label="View comments"
        >
          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
          <span className="text-sm font-medium">{commentCount}</span>
        </Link>

        {/* Tip */}
        {tipEnabled && onTip && (
          <button
            onClick={onTip}
            className="group flex items-center gap-1 rounded-full px-2 py-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-secondary"
            aria-label="Send tip"
          >
            <span className="material-symbols-outlined text-[20px]">toll</span>
            <span className="hidden text-sm font-medium sm:inline">Tip</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={cn(
            'rounded-full p-2 transition-colors hover:bg-surface-container-low',
            optimisticBookmarked ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
          )}
          aria-label={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={
              optimisticBookmarked
                ? ({
                    fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                  } as CSSProperties)
                : undefined
            }
          >
            bookmark
          </span>
        </button>

        {/* Share */}
        {onShare && (
          <button
            onClick={onShare}
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
            aria-label="Share"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        )}
      </div>
    </div>
  );
}
