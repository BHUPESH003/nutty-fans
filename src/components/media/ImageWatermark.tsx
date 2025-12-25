import React from 'react';

interface ImageWatermarkProps {
  text: string;
}

/**
 * Image Watermark Overlay Component
 *
 * Displays a dynamic watermark overlay on images similar to video watermarking
 * Uses diagonal tiled pattern for visibility without being too intrusive
 */
export function ImageWatermark({ text }: ImageWatermarkProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {/* Diagonal tiled pattern - multiple watermarks across the image */}
      <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] whitespace-nowrap text-2xl font-bold text-white opacity-15">
        {text}
      </div>
      <div className="absolute right-1/4 top-1/3 -translate-y-1/2 translate-x-1/2 rotate-[15deg] whitespace-nowrap text-xl font-bold text-white opacity-15">
        {text}
      </div>
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-[-10deg] whitespace-nowrap text-2xl font-bold text-white opacity-15">
        {text}
      </div>
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 rotate-[20deg] whitespace-nowrap text-xl font-bold text-white opacity-15">
        {text}
      </div>
    </div>
  );
}
