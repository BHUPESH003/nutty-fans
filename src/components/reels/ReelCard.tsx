'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useEffect } from 'react';

import { PaywallOverlay } from '@/components/media/PaywallOverlay';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { PostInteractions } from '@/components/posts/PostInteractions';
import { cn } from '@/lib/utils';
import type { PostWithCreator } from '@/types/content';

interface ReelCardProps {
  post: PostWithCreator;
  isActive: boolean;
  onUnlock?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onTip?: () => void;
  onShare?: () => void;
  className?: string;
}

export function ReelCard({
  post,
  isActive,
  onUnlock,
  onLike,
  onBookmark,
  onTip,
  onShare,
  className,
}: ReelCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const primaryMedia = post.media[0];
  const isLocked = !post.hasAccess && post.accessLevel !== 'free';
  const isVideo = primaryMedia?.mediaType === 'video';

  // Track when reel becomes active
  useEffect(() => {
    if (isActive) {
      // Could trigger analytics here
    }
  }, [isActive]);

  return (
    <div ref={containerRef} className={cn('relative h-full w-full bg-black', className)}>
      {/* Full-screen Video */}
      {isVideo && !isLocked && primaryMedia?.id ? (
        <VideoPlayer
          videoId={primaryMedia.id} // Use videoId for secure playback API
          poster={primaryMedia?.thumbnailUrl}
          duration={primaryMedia?.duration}
          variant="reels"
          autoplay={isActive}
          muted={true}
          loop={true}
          className="h-full w-full"
        />
      ) : !isLocked ? (
        // Full-screen image fallback
        <div className="relative h-full w-full">
          <Image
            src={primaryMedia?.processedUrl || primaryMedia?.originalUrl || ''}
            alt="Reel content"
            fill
            className="object-contain"
            priority={isActive}
          />
        </div>
      ) : null}

      {/* Paywall Overlay */}
      {isLocked && (
        <PaywallOverlay
          accessLevel={post.accessLevel}
          ppvPrice={post.ppvPrice}
          previewUrl={primaryMedia?.thumbnailUrl}
          onUnlock={onUnlock}
        />
      )}

      {/* Bottom Gradient */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Creator Info - Bottom Left */}
      <div className="absolute bottom-20 left-4 right-20 z-10">
        <Link href={`/c/${post.creator.handle}`} className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-white/30">
            {post.creator.avatarUrl ? (
              <Image
                src={post.creator.avatarUrl}
                alt={post.creator.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-purple-600 text-lg font-bold text-white">
                {post.creator.displayName[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">{post.creator.displayName}</span>
              {post.creator.isVerified && (
                <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] text-white">
                  ✓
                </span>
              )}
            </div>
            <span className="text-sm text-white/70">@{post.creator.handle}</span>
          </div>
        </Link>

        {/* Caption */}
        {post.content && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/90">{post.content}</p>
        )}
      </div>

      {/* Interaction Bar - Right Side */}
      <div className="absolute bottom-24 right-3 z-10">
        <PostInteractions
          postId={post.id}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          isLiked={post.isLiked}
          isBookmarked={post.isBookmarked}
          tipEnabled={true}
          variant="reels"
          onLike={onLike}
          onBookmark={onBookmark}
          onTip={onTip}
          onShare={onShare}
        />
      </div>

      {/* Premium Badge */}
      {post.accessLevel !== 'free' && !isLocked && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          Purchased
        </div>
      )}
    </div>
  );
}
