'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Shared heading for right-rail widgets (Discover / Home) so sections align
 * and don’t sit flush against the rail edge.
 */
export function RailHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={cn(
        'font-headline text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant',
        className
      )}
    >
      {children}
    </h3>
  );
}

export function RailSection({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('space-y-4', className)}>{children}</section>;
}

/** Muted card surface used for “Live now”–style widgets in the rail */
export function RailCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-container-high/80 bg-surface-container-low p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

interface AppRailLayoutProps {
  children: ReactNode;
  rail: ReactNode;
  /** Optional override for center column (e.g. home feed width) */
  centerClassName?: string;
  centerMaxWidthClassName?: string;
}

/**
 * Two-column layout: primary content + fixed-width right rail.
 * Rail uses consistent horizontal padding so widgets don’t hug the column border.
 */
export function AppRailLayout({
  children,
  rail,
  centerClassName,
  centerMaxWidthClassName = 'max-w-[798px]',
}: AppRailLayoutProps) {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1520px] justify-center gap-4 px-3 md:px-4 xl:gap-5 xl:px-5">
      <div
        className={cn(
          'min-h-screen w-full min-w-0 flex-1 border-x border-border bg-surface-container-lowest',
          centerMaxWidthClassName,
          centerClassName
        )}
      >
        {children}
      </div>
      <aside className="hidden min-h-screen w-[304px] shrink-0 bg-transparent xl:block">
        <div className="sticky top-0 z-10 h-[100dvh] overflow-y-auto">
          <div className="space-y-8 px-6 py-6 pb-12">{rail}</div>
        </div>
      </aside>
    </div>
  );
}
