'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { MediaItem, AccessLevel } from '@/types/content';

import { MediaCarousel } from './MediaCarousel';
import { PaywallOverlay } from './PaywallOverlay';
import { VideoPlayer } from './VideoPlayer';

interface MediaRendererProps {
  media: MediaItem[];
  variant?: 'feed' | 'profile' | 'reels' | 'detail';
  isLocked?: boolean;
  accessLevel?: AccessLevel;
  ppvPrice?: number | null;
  onUnlock?: () => void;
  onSubscribe?: () => void;
  isUnlocking?: boolean;
  className?: string;
}

/**
 * Check if media URL is valid (not empty, null, or 'locked' placeholder)
 */
function isValidMediaUrl(url: string | null | undefined): url is string {
  return !!url && url !== 'locked' && url.length > 0;
}

export function MediaRenderer({
  media,
  variant = 'feed',
  isLocked = false,
  accessLevel = 'free',
  ppvPrice,
  onUnlock,
  onSubscribe,
  isUnlocking = false,
  className,
}: MediaRendererProps) {
  if (media.length === 0) return null;

  const primaryMedia = media[0];
  const hasMultipleMedia = media.length > 1;
  const isVideo = primaryMedia?.mediaType === 'video';

  // Calculate aspect ratio
  const aspectRatio =
    primaryMedia?.width && primaryMedia?.height
      ? primaryMedia.width / primaryMedia.height
      : variant === 'reels'
        ? 9 / 16
        : 4 / 5;

  // Variant-specific styling
  const containerStyles = cn(
    'relative w-full overflow-hidden bg-black/10',
    variant === 'reels' && 'h-full',
    className
  );

  // Get a valid image URL for rendering
  const getMediaUrl = () => {
    const processedUrl = primaryMedia?.processedUrl;
    const originalUrl = primaryMedia?.originalUrl;

    if (isValidMediaUrl(processedUrl)) return processedUrl;
    if (isValidMediaUrl(originalUrl)) return originalUrl;
    return null;
  };

  const mediaUrl = getMediaUrl();

  // Render locked state - show paywall overlay
  if (isLocked && accessLevel !== 'free') {
    return (
      <div
        className={containerStyles}
        style={{ aspectRatio: variant === 'reels' ? undefined : aspectRatio }}
      >
        <PaywallOverlay
          accessLevel={accessLevel}
          ppvPrice={ppvPrice}
          previewUrl={primaryMedia?.thumbnailUrl}
          onUnlock={onUnlock}
          onSubscribe={onSubscribe}
          isLoading={isUnlocking}
        />
      </div>
    );
  }

  // If no valid URL, show placeholder (this happens when content is locked)
  if (!mediaUrl) {
    return (
      <div
        className={containerStyles}
        style={{ aspectRatio: variant === 'reels' ? undefined : aspectRatio }}
      >
        <div className="flex h-full w-full items-center justify-center bg-muted/50">
          <span className="text-sm text-muted-foreground">Media unavailable</span>
        </div>
      </div>
    );
  }

  // Render video
  if (isVideo) {
    // For videos, use videoId to fetch secure playback URL from backend API
    // NEVER pass direct URLs for videos - must use secure playback endpoint
    return (
      <div
        className={containerStyles}
        style={{ aspectRatio: variant === 'reels' ? undefined : aspectRatio }}
      >
        <VideoPlayer
          videoId={primaryMedia.id} // Use videoId for secure playback API
          poster={primaryMedia.thumbnailUrl}
          duration={primaryMedia.duration}
          variant={variant === 'reels' ? 'reels' : variant === 'detail' ? 'detail' : 'feed'}
          autoplay={variant === 'reels'}
          muted={variant === 'reels'}
          loop={variant === 'reels'}
        />
      </div>
    );
  }

  // Render multiple images as carousel
  if (hasMultipleMedia) {
    // Filter out locked media items from carousel
    const validMedia = media.filter(
      (m) => isValidMediaUrl(m.processedUrl) || isValidMediaUrl(m.originalUrl)
    );
    if (validMedia.length === 0) {
      return (
        <div className={containerStyles} style={{ aspectRatio }}>
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            <span className="text-sm text-muted-foreground">Media unavailable</span>
          </div>
        </div>
      );
    }
    return <MediaCarousel media={validMedia} className={containerStyles} />;
  }

  // Render single image
  return (
    <div className={containerStyles} style={{ aspectRatio }}>
      <Image
        src={mediaUrl}
        alt="Post media"
        fill
        className="object-cover"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Watermark will be added on download only via download handler */}
    </div>
  );
}
