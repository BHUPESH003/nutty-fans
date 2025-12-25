/**
 * Video Watermark Overlay Component
 *
 * Displays dynamic watermark overlay on video player
 * Contains: User ID, username, timestamp
 *
 * SECURITY: This overlay helps deter unauthorized sharing/piracy
 * by displaying viewer-specific information on the video
 */

'use client';

import { cn } from '@/lib/utils';

interface VideoWatermarkProps {
  /** Watermark text to display */
  text?: string | null;
  /** Variant/style of watermark */
  variant?: 'reels' | 'feed' | 'detail';
  className?: string;
}

/**
 * Video watermark overlay component
 * Displays semi-transparent watermark text over video content
 */
export function VideoWatermark({ text, variant = 'feed', className }: VideoWatermarkProps) {
  if (!text) return null;

  // Position and styling based on variant
  const positionClasses =
    variant === 'reels'
      ? 'bottom-4 left-4' // Bottom left for reels
      : variant === 'detail'
        ? 'top-4 right-4' // Top right for detail view
        : 'top-2 right-2'; // Top right for feed

  return (
    <div
      className={cn('pointer-events-none absolute z-10 select-none', positionClasses, className)}
    >
      <div className="rounded-md bg-black/40 px-2 py-1 backdrop-blur-sm">
        <p
          className={cn('font-mono text-white/80', variant === 'reels' ? 'text-xs' : 'text-[10px]')}
          style={{
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
