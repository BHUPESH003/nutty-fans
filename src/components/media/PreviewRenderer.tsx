'use client';

import React, { useMemo, useState } from 'react';

import { cn } from '@/lib/utils';
import type {
  AccessLevel,
  BlurRegion,
  MediaItem,
  PostOverlay,
  PostPreviewConfig,
} from '@/types/content';

import { BlurRenderer } from './BlurRenderer';
import { getMediaAspectRatio } from './mediaAspect';
import { PaywallOverlay } from './PaywallOverlay';
import { RegionBlurRenderer } from './RegionBlurRenderer';
import { TeaserRenderer } from './TeaserRenderer';

interface PreviewRendererProps {
  media: MediaItem[];
  variant?: 'feed' | 'profile' | 'reels' | 'detail';
  previewConfig?: PostPreviewConfig;
  overlays?: PostOverlay[];
  accessLevel: AccessLevel;
  ppvPrice?: number | null;
  onUnlock?: () => void | Promise<void>;
  onSubscribe?: () => void | Promise<void>;
  isUnlocking?: boolean;
  className?: string;
}

function isValidMediaUrl(url: string | null | undefined): url is string {
  return !!url && url !== 'locked' && url.length > 0;
}

function getPreviewImageUrl(mediaItem: MediaItem | undefined): string | null {
  if (!mediaItem) return null;
  if (isValidMediaUrl(mediaItem.thumbnailUrl)) return mediaItem.thumbnailUrl;
  if (isValidMediaUrl(mediaItem.processedUrl)) return mediaItem.processedUrl;
  if (isValidMediaUrl(mediaItem.originalUrl)) return mediaItem.originalUrl;
  return null;
}

function CropRenderer({
  imageUrl,
  cropRegion,
}: {
  imageUrl: string;
  cropRegion: { x: number; y: number; width: number; height: number } | undefined;
}) {
  const safe = cropRegion && cropRegion.width > 0 && cropRegion.height > 0 ? cropRegion : null;

  if (!safe) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt="Locked preview"
        className="h-full w-full object-contain"
        draggable={false}
      />
    );
  }

  const scaleX = 100 / safe.width;
  const scaleY = 100 / safe.height;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Locked preview"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
        style={{
          transformOrigin: 'top left',
          transform: `translate(${-safe.x}%, ${-safe.y}%) scale(${scaleX}, ${scaleY})`,
        }}
      />
    </div>
  );
}

export function PreviewRenderer({
  media,
  variant = 'feed',
  previewConfig,
  overlays = [],
  accessLevel,
  ppvPrice,
  onUnlock,
  onSubscribe,
  isUnlocking = false,
  className,
}: PreviewRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const configType = typeof previewConfig?.type === 'string' ? previewConfig.type : 'none';

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[PreviewRenderer] configType', {
      previewConfig,
      configType,
    });
  }

  const clampedIndex = media.length > 0 ? Math.max(0, Math.min(currentIndex, media.length - 1)) : 0;
  const activeMedia = media[clampedIndex];
  const aspectRatio = getMediaAspectRatio(activeMedia, variant);
  const isPortrait = aspectRatio < 1;

  const containerStyles = cn(
    'relative w-full overflow-hidden bg-black/10',
    variant === 'reels' && 'h-full',
    className
  );

  const frameStyle: React.CSSProperties =
    variant === 'reels'
      ? {}
      : variant === 'feed' || variant === 'profile'
        ? { aspectRatio: '4 / 5', maxHeight: 'min(62vh, 680px)' }
        : { aspectRatio, ...(isPortrait ? { maxHeight: 'min(72vh, 860px)' } : {}) };

  const previewImageUrl = useMemo(() => getPreviewImageUrl(activeMedia), [activeMedia]);
  const teaserVideoUrl =
    activeMedia && isValidMediaUrl(activeMedia.previewUrl) ? activeMedia.previewUrl : null;

  const blurIntensity = previewConfig?.blurIntensity ?? 12;
  const blurRegions: BlurRegion[] = previewConfig?.blurRegions ?? [];
  const cropRegion = previewConfig?.cropRegion;

  const posterUrl = activeMedia?.thumbnailUrl ?? null;

  const preview = (() => {
    if (configType === 'teaser') {
      return <TeaserRenderer videoUrl={teaserVideoUrl} posterUrl={posterUrl} />;
    }

    if (!previewImageUrl) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-muted/50">
          <span className="text-sm text-muted-foreground">Media unavailable</span>
        </div>
      );
    }

    if (configType === 'blur') {
      return <BlurRenderer imageUrl={previewImageUrl} blurIntensity={blurIntensity} />;
    }

    if (configType === 'partial_blur') {
      // If there are no regions, fall back to full blur to keep the preview useful.
      if (!blurRegions.length) {
        return <BlurRenderer imageUrl={previewImageUrl} blurIntensity={blurIntensity} />;
      }
      return (
        <RegionBlurRenderer
          imageUrl={previewImageUrl}
          blurIntensity={blurIntensity}
          blurRegions={blurRegions}
        />
      );
    }

    if (configType === 'crop') {
      return <CropRenderer imageUrl={previewImageUrl} cropRegion={cropRegion} />;
    }

    // none/default
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewImageUrl}
          alt="Locked preview"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      </div>
    );
  })();

  return (
    <div className={containerStyles} style={frameStyle}>
      {/* Preview frame */}
      {preview}

      {/* Stickers/masks (always above the preview, below paywall) */}
      {overlays.length > 0 && (
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
      )}

      {/* Paywall overlay on top (locked preview only) */}
      <div className="absolute inset-0 z-10">
        <PaywallOverlay
          accessLevel={accessLevel}
          ppvPrice={ppvPrice}
          // Default locked background preview (used when creator config is missing/none).
          // This replicates the previous "generic locked UI" feel.
          previewUrl={configType === 'none' ? (previewImageUrl ?? posterUrl) : undefined}
          onUnlock={onUnlock}
          onSubscribe={onSubscribe}
          isLoading={isUnlocking}
        />
      </div>

      {/* Locked-preview carousel controls */}
      {media.length > 1 && (
        <>
          <div className="absolute right-3 top-3 z-30 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {currentIndex + 1}/{media.length}
          </div>

          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex((i) => Math.max(0, i - 1));
              }}
              className="absolute left-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              aria-label="Previous preview"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
          )}
          {currentIndex < media.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setCurrentIndex((i) => Math.min(media.length - 1, i + 1));
              }}
              className="absolute right-2 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              aria-label="Next preview"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          )}

          <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
            {media.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                className="h-1.5 rounded-full bg-white/70 transition-all hover:bg-white/90"
                style={{
                  width: idx === currentIndex ? '16px' : '6px',
                  opacity: idx === currentIndex ? 1 : 0.65,
                }}
                aria-label={`Go to preview ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
