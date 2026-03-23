'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';
import type { MediaItem, AccessLevel } from '@/types/content';

import { getMediaAspectRatio } from './mediaAspect';
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

  const aspectRatio = getMediaAspectRatio(primaryMedia, variant);
  const isPortrait = aspectRatio < 1;

  // Variant-specific styling
  const containerStyles = cn(
    'relative w-full overflow-hidden bg-black/10',
    variant === 'reels' && 'h-full',
    className
  );

  const frameStyle: CSSProperties =
    variant === 'reels'
      ? {}
      : {
          aspectRatio,
          ...(isPortrait ? { maxHeight: 'min(85vh, 920px)' } : {}),
        };

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
      <div className={containerStyles} style={frameStyle}>
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

  // Video: playback is resolved via videoId + API — do not require a direct file URL
  if (isVideo && !isLocked) {
    return (
      <div className={containerStyles} style={frameStyle}>
        <VideoPlayer
          videoId={primaryMedia.id}
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

  // If no valid URL, show placeholder
  if (!mediaUrl) {
    return (
      <div className={containerStyles} style={frameStyle}>
        <div className="flex h-full w-full items-center justify-center bg-muted/50">
          <span className="text-sm text-muted-foreground">Media unavailable</span>
        </div>
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
        <div className={containerStyles} style={frameStyle}>
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
    <div className={containerStyles} style={frameStyle}>
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
