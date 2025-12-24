'use client';

import { Heart, MessageCircle, Bookmark, DollarSign, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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
              'rounded-full bg-black/20 p-3 backdrop-blur-sm transition-transform active:scale-90',
              optimisticLiked && 'bg-primary/20'
            )}
          >
            <Heart
              className={cn(
                'h-7 w-7',
                optimisticLiked ? 'fill-primary text-primary' : 'text-white'
              )}
            />
          </div>
          <span className="text-xs font-medium text-white">{optimisticCount}</span>
        </button>

        {/* Comment */}
        <Link
          href={`/post/${postId}`}
          className="flex flex-col items-center gap-1"
          aria-label="View comments"
        >
          <div className="rounded-full bg-black/20 p-3 backdrop-blur-sm">
            <MessageCircle className="h-7 w-7 text-white" />
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
              'rounded-full bg-black/20 p-3 backdrop-blur-sm transition-transform active:scale-90',
              optimisticBookmarked && 'bg-primary/20'
            )}
          >
            <Bookmark
              className={cn(
                'h-7 w-7',
                optimisticBookmarked ? 'fill-primary text-primary' : 'text-white'
              )}
            />
          </div>
        </button>

        {/* Tip */}
        {tipEnabled && onTip && (
          <button
            onClick={onTip}
            className="flex flex-col items-center gap-1"
            aria-label="Send tip"
          >
            <div className="rounded-full bg-black/20 p-3 backdrop-blur-sm transition-transform hover:bg-green-500/20 active:scale-90">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
          </button>
        )}

        {/* Share */}
        {onShare && (
          <button onClick={onShare} className="flex flex-col items-center gap-1" aria-label="Share">
            <div className="rounded-full bg-black/20 p-3 backdrop-blur-sm transition-transform active:scale-90">
              <Share2 className="h-7 w-7 text-white" />
            </div>
          </button>
        )}
      </div>
    );
  }

  // Feed variant - horizontal bar
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-6">
        {/* Like */}
        <button
          onClick={handleLike}
          className={cn(
            'group flex items-center gap-2 transition-colors',
            optimisticLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          )}
          aria-label={optimisticLiked ? 'Unlike' : 'Like'}
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-transform group-active:scale-75',
              optimisticLiked && 'scale-110 fill-current'
            )}
          />
          <span className="text-sm font-medium">{optimisticCount}</span>
        </button>

        {/* Comment */}
        <Link
          href={`/post/${postId}`}
          className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="View comments"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{commentCount}</span>
        </Link>

        {/* Tip */}
        {tipEnabled && onTip && (
          <button
            onClick={onTip}
            className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-green-500"
            aria-label="Send tip"
          >
            <DollarSign className="h-5 w-5" />
            <span className="hidden text-sm font-medium sm:inline">Tip</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={cn(
            'transition-colors',
            optimisticBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label={optimisticBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <Bookmark className={cn('h-5 w-5', optimisticBookmarked && 'fill-current')} />
        </button>

        {/* Share */}
        {onShare && (
          <button
            onClick={onShare}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
