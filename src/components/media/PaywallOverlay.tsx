'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AccessLevel } from '@/types/content';

interface PaywallOverlayProps {
  accessLevel: AccessLevel;
  ppvPrice?: number | null;
  previewUrl?: string | null;
  onUnlock?: () => void | Promise<void>;
  onSubscribe?: () => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function PaywallOverlay({
  accessLevel,
  ppvPrice,
  previewUrl: _previewUrl,
  onUnlock,
  onSubscribe,
  isLoading = false,
  className,
}: PaywallOverlayProps) {
  const isPpv = accessLevel === 'ppv';
  const isSubscribers = accessLevel === 'subscribers';

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)}>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/85 p-6 text-center">
        {/* Lock Icon */}
        <div className="mb-4 rounded-full bg-white/10 p-4">
          <span className="material-symbols-outlined text-4xl text-white">lock</span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-xl font-bold text-white">
          {isPpv ? 'Premium Content' : 'Subscribers Only'}
        </h3>

        {/* Description */}
        <p className="mb-6 max-w-xs text-sm text-white/80">
          {isPpv
            ? `Unlock this exclusive content for $${ppvPrice?.toFixed(2) || '0.00'}`
            : 'Subscribe to view this exclusive content'}
        </p>

        {/* CTA Button */}
        {isPpv && onUnlock && (
          <Button
            size="lg"
            onClick={onUnlock}
            disabled={isLoading}
            className="min-w-[200px] font-semibold shadow-xl shadow-primary/20"
          >
            {isLoading ? 'Unlocking...' : `Unlock for $${ppvPrice?.toFixed(2) || '0.00'}`}
          </Button>
        )}

        {isSubscribers && onSubscribe && (
          <Button
            size="lg"
            onClick={async () => {
              try {
                await onSubscribe();
              } catch (error) {
                console.error('Subscribe error:', error);
              }
            }}
            disabled={isLoading}
            className="min-w-[200px] font-semibold shadow-xl shadow-primary/20"
          >
            {isLoading ? 'Subscribing...' : 'Subscribe Now'}
          </Button>
        )}

        {/* Badge */}
        <div className="absolute left-3 top-3 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
          {isPpv ? '💎 Premium' : '🔐 Subscribers'}
        </div>
      </div>
    </div>
  );
}
