'use client';

import React from 'react';

import type { BlurRegion } from '@/types/content';

interface RegionBlurRendererProps {
  imageUrl: string;
  blurIntensity: number; // 0-20 (px)
  blurRegions: BlurRegion[];
}

export function RegionBlurRenderer({
  imageUrl,
  blurIntensity,
  blurRegions,
}: RegionBlurRendererProps) {
  const blurPx = Math.max(0, blurIntensity);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Locked preview"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      {blurRegions.map((r, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: `${r.x}%`,
            top: `${r.y}%`,
            width: `${r.width}%`,
            height: `${r.height}%`,
            background: 'rgba(0,0,0,0.015)', // Needed for some browsers to trigger backdrop-filter
            WebkitBackdropFilter: `blur(${blurPx}px)`,
            backdropFilter: `blur(${blurPx}px)`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
