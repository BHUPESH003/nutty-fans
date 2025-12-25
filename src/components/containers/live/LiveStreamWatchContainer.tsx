'use client';

import { useCallback, useEffect, useState } from 'react';

import { VideoPlayer } from '@/components/media/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/apiClient';

interface StreamDetails {
  stream: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    accessLevel: 'free' | 'subscribers' | 'paid';
    entryPrice: number | null;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    creator: { handle: string | null; displayName: string | null; avatarUrl: string | null };
  };
  hasAccess: boolean;
}

export function LiveStreamWatchContainer({ streamId }: { streamId: string }) {
  const [data, setData] = useState<StreamDetails | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.streams.get(streamId);
      setData(res as StreamDetails);
    } finally {
      setIsLoading(false);
    }
  }, [streamId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadPlayback = async () => {
      if (!data?.hasAccess) return;
      if (data.stream.status !== 'live') return;
      const urls = await apiClient.streams.getPlayback(streamId);
      setPlaybackUrl(urls.streamUrl ?? null);
    };
    void loadPlayback();
  }, [data?.hasAccess, data?.stream.status, streamId]);

  const handlePurchase = async () => {
    setIsBuying(true);
    try {
      await apiClient.streams.purchase(streamId);
      await load();
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const { stream, hasAccess } = data;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-bold">{stream.title}</div>
        <div className="text-sm text-muted-foreground">
          {stream.creator?.handle ? `@${stream.creator.handle}` : null}
        </div>
      </div>

      {stream.status !== 'live' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Not live</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This stream is {stream.status}.
          </CardContent>
        </Card>
      ) : !hasAccess ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Locked</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {stream.accessLevel === 'subscribers'
                ? 'Subscribe to watch this live stream.'
                : 'Purchase access to watch this live stream.'}
            </div>
            {stream.accessLevel === 'paid' ? (
              <Button onClick={() => void handlePurchase()} disabled={isBuying}>
                {isBuying ? 'Purchasing...' : `Buy access $${(stream.entryPrice ?? 0).toFixed(2)}`}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : playbackUrl ? (
        <Card>
          <CardContent className="p-4">
            <VideoPlayer src={playbackUrl} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loading stream...</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Waiting for playback to become available.
          </CardContent>
        </Card>
      )}

      {stream.description ? (
        <Card>
          <CardContent className="whitespace-pre-wrap p-4 text-sm">
            {stream.description}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
