'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/apiClient';

interface LiveStreamListItem {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  accessLevel: 'free' | 'subscribers' | 'paid';
  entryPrice: unknown;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  creator: {
    user: { username: string | null; displayName: string | null; avatarUrl: string | null };
  };
}

export function LiveStreamsPageContainer() {
  const [streams, setStreams] = useState<LiveStreamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.streams.listLive();
        setStreams((res.streams || []) as LiveStreamListItem[]);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const priceLabel = (s: LiveStreamListItem) => {
    if (s.accessLevel !== 'paid') return null;
    const n = typeof s.entryPrice === 'number' ? s.entryPrice : Number(s.entryPrice);
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live</h1>
        <p className="text-sm text-muted-foreground">Watch creators live right now.</p>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : streams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No live streams</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Check back soon.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {streams.map((s) => {
            const creatorHandle = s.creator?.user?.username;
            return (
              <Card key={s.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <Link href={`/live/${s.id}` as Route} className="block">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{s.title}</div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="uppercase text-red-500">LIVE</span>
                          <span className="capitalize">{s.accessLevel}</span>
                          {priceLabel(s) ? <span>{priceLabel(s)}</span> : null}
                          {creatorHandle ? <span>@{creatorHandle}</span> : null}
                        </div>
                      </div>
                      <div className="flex-shrink-0 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-500">
                        Watch
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
