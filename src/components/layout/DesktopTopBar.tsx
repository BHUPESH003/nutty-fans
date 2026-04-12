'use client';

import { Suspense } from 'react';

import { SearchBar } from '@/components/search/SearchBar';

export function DesktopTopBar() {
  return (
    <header className="sticky top-0 z-20 hidden border-b border-border bg-background/95 backdrop-blur-xl md:block">
      <div className="flex h-16 w-full items-center gap-3 px-4 lg:px-5">
        <Suspense
          fallback={
            <div className="h-11 w-full animate-pulse rounded-full bg-surface-container-low" />
          }
        >
          <SearchBar
            variant="discover"
            className="min-w-0 flex-1 [&>div]:border [&>div]:border-border [&>div]:bg-surface-container-lowest"
            placeholder="Search creators or tags..."
          />
        </Suspense>
      </div>
    </header>
  );
}
