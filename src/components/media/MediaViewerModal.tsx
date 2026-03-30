'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MediaViewerItem {
  type: 'image' | 'video';
  src: string;
  poster?: string | null;
  alt?: string;
}

interface MediaViewerModalProps {
  open: boolean;
  items: MediaViewerItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function MediaViewerModal({
  open,
  items,
  initialIndex = 0,
  onClose,
}: MediaViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!open) return;
    setIndex(Math.max(0, Math.min(initialIndex, Math.max(0, items.length - 1))));
    setZoom(1);
  }, [open, initialIndex, items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight' && items.length > 1) {
        setIndex((prev) => (prev + 1) % items.length);
      }
      if (event.key === 'ArrowLeft' && items.length > 1) {
        setIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, items.length]);

  const active = useMemo(() => items[index], [items, index]);

  if (!open || !active) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 z-[130] flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-10 w-10"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
          }}
        >
          <span className="material-symbols-outlined">zoom_out</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-10 w-10"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))));
          }}
        >
          <span className="material-symbols-outlined">zoom_in</span>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-10 w-10"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <span className="material-symbols-outlined">close</span>
        </Button>
      </div>

      {items.length > 1 && (
        <>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute left-4 top-1/2 z-[130] h-10 w-10 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev - 1 + items.length) % items.length);
            }}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-4 top-1/2 z-[130] h-10 w-10 -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((prev) => (prev + 1) % items.length);
            }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </Button>
          <div className="absolute bottom-4 left-1/2 z-[130] -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {index + 1}/{items.length}
          </div>
        </>
      )}

      <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
        {active.type === 'video' ? (
          <video
            src={active.src}
            poster={active.poster || undefined}
            controls
            playsInline
            preload="metadata"
            className={cn('max-h-[90vh] max-w-[92vw] bg-black')}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.src}
            alt={active.alt || 'Media preview'}
            className="max-h-[90vh] max-w-[92vw] object-contain"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          />
        )}
      </div>
    </div>
  );
}
