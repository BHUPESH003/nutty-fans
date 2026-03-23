'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;

  onSearch?: (_q: string) => void;
  defaultValue?: string;
  className?: string;
  /** Discover / hero: full pill, softer focus ring (matches Daylight mockups) */
  variant?: 'default' | 'discover';
}

export function SearchBar({
  placeholder = 'Search creators, posts...',
  onSearch,
  defaultValue,
  className,
  variant = 'default',
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(defaultValue || searchParams.get('q') || '');

  useEffect(() => {
    if (defaultValue) {
      setQuery(defaultValue);
    }
  }, [defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (onSearch) {
      onSearch(query.trim());
    } else {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    } else {
      router.push('/explore');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <div
        className={cn(
          'relative',
          variant === 'discover' &&
            'rounded-full bg-surface-container-low transition-colors focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/25'
        )}
      >
        <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[20px] text-on-surface-variant">
          search
        </span>
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            'w-full pl-12 pr-10',
            variant === 'discover' &&
              'rounded-full border-0 bg-transparent py-3.5 shadow-none focus:bg-transparent focus:ring-0'
          )}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={handleClear}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </Button>
        )}
      </div>
    </form>
  );
}
