'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { BrowserCameraPreview } from '@/components/creator/BrowserCameraPreview';
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

interface CreatorStreamRow {
  id: string;
  title: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  durationSeconds: number | null;
  viewerCount: number;
  peakViewers: number;
  totalTips: number;
  recordingUrl: string | null;
  startedAt: string | null;
}

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

function formatWhen(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '—';
  }
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

  const [streams, setStreams] = useState<CreatorStreamRow[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(true);
  const [streamsError, setStreamsError] = useState<string | null>(null);
  const [continueForId, setContinueForId] = useState<string | null>(null);

  const loadStreams = useCallback(async () => {
    setStreamsError(null);
    setStreamsLoading(true);
    try {
      const res = await apiClient.streams.listMine();
      setStreams((res.streams as CreatorStreamRow[]) ?? []);
    } catch (e) {
      setStreamsError(e instanceof Error ? e.message : 'Could not load streams');
      setStreams([]);
    } finally {
      setStreamsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStreams();
  }, [loadStreams]);

  useEffect(() => {
    if (accessLevel !== 'paid') setEntryPrice('5.00');
  }, [accessLevel]);

  const { activeStreams, pastStreams } = useMemo(() => {
    const active = streams.filter((s) => s.status === 'scheduled' || s.status === 'live');
    const past = streams.filter((s) => s.status === 'ended' || s.status === 'cancelled');
    return { activeStreams: active, pastStreams: past };
  }, [streams]);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.streams.create({
        title,
        description,
        accessLevel,
        entryPrice: accessLevel === 'paid' ? Number(entryPrice) : null,
      });
      const s = res.stream as CreatedStream;
      setCreated({
        ...s,
        status: s.status ?? 'scheduled',
        streamKey: s.streamKey ?? '',
        rtmpUrl: s.rtmpUrl ?? '',
      });
      await loadStreams();
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
      await loadStreams();
    } finally {
      setIsStarting(false);
    }
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
  };

  const handleEnd = async () => {
    if (!created) return;
    setIsEnding(true);
    try {
      await apiClient.streams.end(created.id);
      setCreated(null);
      await loadStreams();
    } finally {
      setIsEnding(false);
    }
  };

  const openViewerInNewTab = (streamId: string) => {
    window.open(`/live/${streamId}`, '_blank', 'noopener,noreferrer');
  };

  const handleContinue = async (streamId: string) => {
    setContinueForId(streamId);
    try {
      const res = await apiClient.streams.getCreatorStream(streamId);
      const s = res.stream as CreatedStream;
      setCreated({
        ...s,
        status: s.status ?? 'scheduled',
        streamKey: s.streamKey ?? '',
        rtmpUrl: s.rtmpUrl ?? '',
      });
    } finally {
      setContinueForId(null);
    }
  };

  const handleBackToList = () => {
    setCreated(null);
  };

  const renderStreamTable = (label: string, rows: CreatorStreamRow[]) => (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">None yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Started</th>
                <th className="px-3 py-2 font-medium">Duration</th>
                <th className="px-3 py-2 font-medium">Viewers</th>
                <th className="px-3 py-2 font-medium">Peak</th>
                <th className="px-3 py-2 font-medium">Tips</th>
                <th className="px-3 py-2 font-medium">Recording</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{row.title}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatWhen(row.startedAt)}</td>
                  <td className="px-3 py-2">{formatDuration(row.durationSeconds)}</td>
                  <td className="px-3 py-2">{row.viewerCount}</td>
                  <td className="px-3 py-2">{row.peakViewers}</td>
                  <td className="px-3 py-2">{formatMoney(row.totalTips)}</td>
                  <td className="px-3 py-2">
                    {row.recordingUrl ? (
                      <a
                        href={row.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Open
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(row.status === 'scheduled' || row.status === 'live') && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={continueForId === row.id}
                          onClick={() => void handleContinue(row.id)}
                        >
                          {continueForId === row.id ? '…' : 'Continue'}
                        </Button>
                      )}
                      {row.status === 'live' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openViewerInNewTab(row.id)}
                        >
                          Open viewer
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Go Live"
        subtitle="Create streams, manage RTMP ingest, and review stats for current and past broadcasts. Opening the viewer uses a new tab so your dashboard history stays clean."
      />

      {streamsError ? <p className="text-sm text-destructive">{streamsError}</p> : null}

      {created ? (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Stream setup</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Status:</span>{' '}
                <span className="capitalize">{created.status}</span>
                {created.status === 'scheduled'
                  ? ' — when your encoder is sending to Mux, use Go live so viewers can watch.'
                  : null}
                {created.status === 'live' ? ' — you are broadcasting. End when finished.' : null}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleBackToList}>
              Back to list
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <BrowserCameraPreview />

            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium">Broadcast for viewers</p>
              <p className="text-xs text-muted-foreground">
                This tells the app your stream is live so the watch page works. Connect OBS (or
                another encoder) using the RTMP details below first, then tap Go live.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={() => void handleStart()}
                  disabled={created.status !== 'scheduled' || isStarting}
                >
                  {isStarting ? 'Going live…' : 'Go live'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => void handleEnd()}
                  disabled={created.status !== 'live' || isEnding}
                >
                  {isEnding ? 'Ending…' : 'End broadcast'}
                </Button>
                {created.status === 'live' ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => openViewerInNewTab(created.id)}
                  >
                    Open viewer (new tab)
                  </Button>
                ) : null}
              </div>
              {created.status !== 'scheduled' && created.status !== 'live' ? (
                <p className="text-xs text-muted-foreground">
                  This session is no longer active. Use Back to list to manage other streams.
                </p>
              ) : null}
            </div>

            <details className="group rounded-xl border bg-card">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  <span>Encoder / RTMP (Mux)</span>
                  <span className="text-xs font-normal text-muted-foreground group-open:hidden">
                    Show URL &amp; stream key
                  </span>
                  <span className="hidden text-xs font-normal text-muted-foreground group-open:inline">
                    Hide
                  </span>
                </span>
              </summary>
              <div className="space-y-4 border-t px-4 pb-4 pt-3">
                <p className="text-xs text-muted-foreground">
                  Mux ingest is RTMP only. Paste these into OBS, Larix, etc. Keep your stream key
                  private.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>RTMP URL</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => void copyToClipboard(created.rtmpUrl)}
                    >
                      Copy
                    </Button>
                  </div>
                  <Input readOnly value={created.rtmpUrl} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Stream key</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => void copyToClipboard(created.streamKey)}
                    >
                      Copy
                    </Button>
                  </div>
                  <Input readOnly value={created.streamKey} type="password" autoComplete="off" />
                </div>
              </div>
            </details>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your streams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {streamsLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              {renderStreamTable('Current & upcoming', activeStreams)}
              {renderStreamTable('Previous', pastStreams)}
            </>
          )}
        </CardContent>
      </Card>

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
      ) : null}
    </div>
  );
}
