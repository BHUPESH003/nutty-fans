'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

/**
 * In-app camera/mic preview for creators. Mux Live ingest is still RTMP; this keeps setup inside the app.
 */
export function BrowserCameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stop = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });
      setStream(ms);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not access camera or microphone');
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !stream) return;
    v.srcObject = stream;
    void v.play().catch(() => {});
  }, [stream]);

  return (
    <div className="space-y-3 rounded-xl border border-surface-container-high bg-surface-container-lowest p-4">
      <div>
        <p className="font-headline text-sm font-semibold text-on-surface">In-app camera preview</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Check your framing here before you broadcast. Preview audio is muted in the browser so
          autoplay works; your encoder will still send mic audio to Mux via RTMP.
        </p>
      </div>
      <div className="aspect-video max-h-[220px] overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {!stream ? (
          <Button type="button" size="sm" onClick={() => void start()}>
            Start camera preview
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={stop}>
            Stop preview
          </Button>
        )}
      </div>
    </div>
  );
}
