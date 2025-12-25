'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/apiClient';

interface CreatedStream {
  id: string;
  title: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  streamKey: string;
  rtmpUrl: string;
}

export function CreatorLiveContainer() {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('Live Stream');
  const [description, setDescription] = useState('');
  const [accessLevel, setAccessLevel] = useState<'subscribers' | 'free' | 'paid'>('subscribers');
  const [entryPrice, setEntryPrice] = useState('5.00');
  const [created, setCreated] = useState<CreatedStream | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    // keep entryPrice sane when not paid
    if (accessLevel !== 'paid') setEntryPrice('5.00');
  }, [accessLevel]);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.streams.create({
        title,
        description,
        accessLevel,
        entryPrice: accessLevel === 'paid' ? Number(entryPrice) : null,
      });
      setCreated(res.stream as CreatedStream);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!created) return;
    setIsStarting(true);
    try {
      await apiClient.streams.start(created.id);
      setCreated({ ...created, status: 'live' });
    } finally {
      setIsStarting(false);
    }
  };

  const handleEnd = async () => {
    if (!created) return;
    setIsEnding(true);
    try {
      await apiClient.streams.end(created.id);
      setCreated({ ...created, status: 'ended' });
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Go Live" subtitle="Create a Mux Live stream and broadcast via RTMP." />

      {!created ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create stream</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Access</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={accessLevel === 'free' ? 'default' : 'outline'}
                    onClick={() => setAccessLevel('free')}
                  >
                    Free
                  </Button>
                  <Button
                    type="button"
                    variant={accessLevel === 'subscribers' ? 'default' : 'outline'}
                    onClick={() => setAccessLevel('subscribers')}
                  >
                    Subscribers
                  </Button>
                  <Button
                    type="button"
                    variant={accessLevel === 'paid' ? 'default' : 'outline'}
                    onClick={() => setAccessLevel('paid')}
                  >
                    Paid
                  </Button>
                </div>
              </div>
              {accessLevel === 'paid' ? (
                <div className="space-y-2">
                  <Label htmlFor="entry">Entry price</Label>
                  <Input
                    id="entry"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              ) : null}
            </div>
            <Button onClick={() => void handleCreate()} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create stream'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stream ready</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Use these values in OBS (or another RTMP broadcaster). Keep your stream key private.
            </div>
            <div className="space-y-2">
              <Label>RTMP URL</Label>
              <Input readOnly value={created.rtmpUrl} />
            </div>
            <div className="space-y-2">
              <Label>Stream Key</Label>
              <Input readOnly value={created.streamKey} />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => void handleStart()}
                disabled={created.status !== 'scheduled' || isStarting}
              >
                {isStarting ? 'Starting...' : 'Mark Live'}
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleEnd()}
                disabled={created.status !== 'live' || isEnding}
              >
                {isEnding ? 'Ending...' : 'End'}
              </Button>
              <Button variant="outline" asChild>
                <a href={`/live/${created.id}`}>Open viewer page</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
