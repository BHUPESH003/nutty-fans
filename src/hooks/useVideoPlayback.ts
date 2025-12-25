/**
 * Secure Video Playback Hook
 *
 * Fetches playback URLs from secure backend API
 * Handles token expiration and refresh
 */

import { useEffect, useState } from 'react';
import useSWR from 'swr';

interface VideoPlaybackResponse {
  playbackUrl: string;
  thumbnailUrl: string;
  posterUrl: string;
  watermarkText?: string; // Watermark text for overlay
  expiresIn: number;
  expiresAt: string;
}

export function useVideoPlayback(videoId: string | null, enabled: boolean = true) {
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const { data, error, isLoading, mutate } = useSWR<VideoPlaybackResponse>(
    enabled && videoId ? `/api/videos/${videoId}/playback` : null,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Subscription or purchase required.');
        }
        if (response.status === 404) {
          throw new Error('Video not found');
        }
        throw new Error('Failed to load video playback URL');
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Don't automatically refresh - URLs expire, need manual refresh
      refreshInterval: 0,
    }
  );

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setPlaybackUrl(data.playbackUrl);
      setPosterUrl(data.posterUrl);
      setThumbnailUrl(data.thumbnailUrl);
      setWatermarkText(data.watermarkText || null);
      setExpiresAt(new Date(data.expiresAt));
    }
  }, [data]);

  // Check if token is expired and refresh if needed
  useEffect(() => {
    if (!expiresAt || !enabled || !videoId) return;

    const checkExpiration = () => {
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      // Refresh if less than 1 minute remaining
      if (timeUntilExpiry < 60000 && timeUntilExpiry > 0) {
        void mutate();
      }
    };

    const interval = setInterval(checkExpiration, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [expiresAt, enabled, videoId, mutate]);

  return {
    playbackUrl,
    posterUrl,
    thumbnailUrl,
    watermarkText,
    isLoading,
    error,
    refresh: mutate,
  };
}
