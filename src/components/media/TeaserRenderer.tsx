'use client';

import React from 'react';

interface TeaserRendererProps {
  videoUrl: string | null;
  posterUrl?: string | null;
}

export function TeaserRenderer({ videoUrl, posterUrl }: TeaserRendererProps) {
  const isGif = videoUrl ? videoUrl.toLowerCase().endsWith('.gif') : false;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {videoUrl && !isGif ? (
        <video
          src={videoUrl}
          poster={posterUrl ?? undefined}
          className="absolute inset-0 h-full w-full object-contain"
          muted
          playsInline
          loop
          autoPlay
        />
      ) : videoUrl && isGif ? (
        // Legacy Mux teaser asset is sometimes a GIF (preview_url).
        // GIFs can't be reliably treated as <video>, so we render as an image.
        // (Once ffmpeg generation runs, preview_url will become an mp4 for true teaser playback.)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={videoUrl}
          alt="Teaser preview"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={posterUrl ?? ''}
          alt="Teaser preview"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      )}
    </div>
  );
}
