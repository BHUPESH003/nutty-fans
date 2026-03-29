'use client';

import Link from 'next/link';
import { Suspense } from 'react';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SearchBar } from '@/components/search/SearchBar';

export function DesktopTopBar() {
  return (
    <header className="sticky top-0 z-20 hidden border-b border-surface-container-low bg-white/95 backdrop-blur-xl md:block">
      <div className="flex h-16 w-full items-center gap-3 px-4 lg:px-5">
        <Suspense
          fallback={
            <div className="h-11 w-full animate-pulse rounded-full bg-surface-container-low" />
          }
        >
          <SearchBar
            variant="discover"
            className="min-w-0 flex-1 [&>div]:border [&>div]:border-neutral-200 [&>div]:bg-white"
            placeholder="Search creators or tags..."
          />
        </Suspense>
        <Link
          href="/messages"
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
          aria-label="Messages"
        >
          <span className="material-symbols-outlined text-[22px]">chat_bubble</span>
        </Link>
        <NotificationBell />
      </div>
    </header>
  );
}
