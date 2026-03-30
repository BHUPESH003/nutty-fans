'use client';

import { useEffect, useState, type CSSProperties } from 'react';

import { cn } from '@/lib/utils';
import { request } from '@/services/apiClient';
import type { AccessLevel, MediaItem, PostOverlay, PostPreviewConfig } from '@/types/content';

import { getMediaAspectRatio } from './mediaAspect';
import { MediaCarousel } from './MediaCarousel';
import { MediaViewerModal } from './MediaViewerModal';
import { PreviewRenderer } from './PreviewRenderer';
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
  previewConfig?: PostPreviewConfig;
  overlays?: PostOverlay[];
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
  previewConfig: _previewConfig,
  overlays,
  className,
}: MediaRendererProps) {
  const primaryMedia = media[0];
  const hasMultipleMedia = media.length > 1;
  const isVideo = primaryMedia?.mediaType === 'video';

  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    // Only sign images, only for single-image rendering (carousel handles its own signing).
    if (isLocked) return;
    if (isVideo) return;
    if (hasMultipleMedia) return;
    if (!primaryMedia?.id) return;

    let cancelled = false;
    setSignedImageUrl(null);

    void request<{ signedUrl: string }>(`/api/media/${primaryMedia.id}`)
      .then((res) => {
        if (cancelled) return;
        setSignedImageUrl(res.signedUrl ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setSignedImageUrl(null);
      })
      .finally(() => {
        if (cancelled) return;
      });

    return () => {
      cancelled = true;
    };
  }, [hasMultipleMedia, isLocked, isVideo, primaryMedia?.id]);

  if (media.length === 0) return null;

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
      : variant === 'feed' || variant === 'profile'
        ? {
            aspectRatio: '4 / 5',
            maxHeight: 'min(62vh, 680px)',
          }
        : {
            aspectRatio,
            ...(isPortrait ? { maxHeight: 'min(72vh, 860px)' } : {}),
          };

  // Render locked state - show paywall overlay (without blur/crop teaser effects)
  if (isLocked && accessLevel !== 'free') {
    return (
      <div className={containerStyles} style={frameStyle}>
        <PreviewRenderer
          media={media}
          variant={variant}
          previewConfig={undefined}
          overlays={overlays ?? []}
          accessLevel={accessLevel}
          ppvPrice={ppvPrice}
          onUnlock={onUnlock}
          onSubscribe={onSubscribe}
          isUnlocking={isUnlocking}
          className="w-full"
        />
      </div>
    );
  }

  const overlayLayer =
    overlays && overlays.length > 0 ? (
      <div className="pointer-events-none absolute inset-0 z-10">
        {overlays.map((o, idx) => (
          <div
            key={`${o.assetUrl}-${idx}`}
            style={{
              position: 'absolute',
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: `${o.width}%`,
              height: `${o.height}%`,
              filter: o.type === 'mask' ? 'grayscale(1) contrast(1.2)' : undefined,
              mixBlendMode: o.type === 'mask' ? 'multiply' : undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={o.assetUrl}
              alt={o.type}
              className="h-full w-full object-contain"
              draggable={false}
            />
          </div>
        ))}
      </div>
    ) : null;

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
        {overlayLayer}
      </div>
    );
  }

  // If no valid URL, show placeholder
  const unlockedImageUrl = signedImageUrl ?? primaryMedia?.thumbnailUrl ?? null;

  if (!unlockedImageUrl) {
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
    return (
      <div className={containerStyles}>
        <MediaCarousel media={validMedia} />
        {overlayLayer}
      </div>
    );
  }

  // Render single image - images open fullscreen on click, videos use player controls only
  const isImage = !isVideo;

  return (
    <div className={containerStyles} style={frameStyle}>
      {isImage ? (
        <button
          type="button"
          className="h-full w-full"
          onClick={() => setViewerOpen(true)}
          aria-label="Open media fullscreen"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={unlockedImageUrl}
            alt="Post media"
            className={cn(
              'h-full w-full',
              variant === 'feed' || variant === 'profile' ? 'object-contain' : 'object-cover'
            )}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </button>
      ) : (
        <div className="h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={unlockedImageUrl}
            alt="Post media"
            className={cn(
              'h-full w-full',
              variant === 'feed' || variant === 'profile' ? 'object-contain' : 'object-cover'
            )}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      )}
      {overlayLayer}
      {/* Watermark will be added on download only via download handler */}
      <MediaViewerModal
        open={viewerOpen}
        items={[{ type: 'image', src: unlockedImageUrl, alt: 'Post media' }]}
        onClose={() => setViewerOpen(false)}
      />
    </div>
  );
}
