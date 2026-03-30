'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/services/apiClient';

interface Creator {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  subscriberCount: number;
  isVerified: boolean;
  categoryName: string | null;
}

interface TrendingCreatorsProps {
  /** Compact vertical list for home right rail */
  variant?: 'grid' | 'rail';
  /** When rail + parent supplies RailHeading */
  hideHeading?: boolean;
  /** Optional category slug to show only creators with that category */
  categorySlug?: string;
}

export function TrendingCreators({
  variant = 'grid',
  hideHeading = false,
  categorySlug,
}: TrendingCreatorsProps) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const result = await apiClient.search.getTrendingCreators(10);
        // Filter by categorySlug if provided
        let filtered = result.creators;
        if (categorySlug) {
          filtered = result.creators.filter(
            (creator) => creator.category?.slug?.toLowerCase() === categorySlug.toLowerCase()
          );
        }
        setCreators(filtered);
      } catch (error) {
        console.error('Failed to load trending creators:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadTrending();
  }, [categorySlug]);

  const heading = variant === 'rail' ? 'Suggested Creators' : 'Trending Creators';

  if (loading) {
    return (
      <div className="space-y-4">
        {!hideHeading && <h2 className="font-headline text-lg font-bold">{heading}</h2>}
        <div
          className={
            variant === 'rail'
              ? 'space-y-3'
              : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
          }
        >
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (creators.length === 0) {
    return null;
  }

  if (variant === 'rail') {
    return (
      <div className="space-y-4">
        {!hideHeading && <h2 className="font-headline text-lg font-bold">{heading}</h2>}
        <ul className="space-y-3">
          {creators.slice(0, 8).map((creator) => (
            <li key={creator.id} className="flex items-center gap-3">
              <Link
                href={`/c/${creator.handle}`}
                className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden"
              >
                <Avatar className="h-9 w-9 shrink-0 ring-2 ring-transparent ring-offset-0">
                  <AvatarImage src={creator.avatarUrl || ''} alt="" />
                  <AvatarFallback className="text-xs">{creator.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-bold leading-tight text-on-surface">
                    {creator.displayName}
                  </p>
                  <p className="truncate text-xs text-on-surface-variant">@{creator.handle}</p>
                </div>
              </Link>
              <Link
                href={`/c/${creator.handle}`}
                className="shrink-0 rounded-full border border-primary/20 px-3 py-1 text-xs font-bold text-primary transition-colors hover:bg-primary/5"
              >
                Follow
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/explore"
          className="block py-1 text-center text-xs font-bold text-primary hover:underline"
        >
          View all recommendations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hideHeading && <h2 className="font-headline text-lg font-bold">{heading}</h2>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((creator) => (
          <Link key={creator.id} href={`/c/${creator.handle}`}>
            <Card className="transition-colors hover:bg-surface-container-low">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={creator.avatarUrl || ''} />
                    <AvatarFallback>{creator.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1">
                      <p className="truncate font-medium">{creator.displayName}</p>
                      {creator.isVerified && (
                        <span className="material-symbols-outlined text-sm text-secondary">
                          verified
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">@{creator.handle}</p>
                    <p className="text-xs text-muted-foreground">
                      {creator.subscriberCount.toLocaleString()} subscribers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
