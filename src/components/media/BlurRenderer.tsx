'use client';

import React from 'react';

interface BlurRendererProps {
  imageUrl: string;
  blurIntensity: number; // 0-20 (px)
}

export function BlurRenderer({ imageUrl, blurIntensity }: BlurRendererProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Locked preview"
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
        style={{ filter: `blur(${Math.max(0, blurIntensity)}px)` }}
      />
    </div>
  );
}
