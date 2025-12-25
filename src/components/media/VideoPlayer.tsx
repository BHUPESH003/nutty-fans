'use client';

import type Hls from 'hls.js';
import type { ErrorData } from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2 } from 'lucide-react';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { cn } from '@/lib/utils';

import { VideoWatermark } from './VideoWatermark';

interface VideoPlayerProps {
  /** Video media ID - REQUIRED for secure playback (fetches URL from backend API) */
  videoId?: string;
  /** Direct src URL - DEPRECATED, use videoId instead. Only for backward compatibility */
  src?: string;
  /** Thumbnail/poster URL (optional, can be fetched from playback API) */
  poster?: string | null;
  duration?: number | null;
  variant?: 'feed' | 'reels' | 'detail';
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
}

export function VideoPlayer({
  videoId,
  src: srcProp, // Deprecated - for backward compatibility only
  poster: posterProp,
  duration,
  variant = 'feed',
  autoplay = false,
  muted = true,
  loop = false,
  className,
  onPlay,
  onPause,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(variant !== 'reels');
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch secure playback URL from backend API (REQUIRED for videos)
  const {
    playbackUrl,
    posterUrl: securePosterUrl,
    thumbnailUrl,
    watermarkText,
    isLoading: isPlaybackLoading,
    error: playbackError,
  } = useVideoPlayback(videoId || null, !!videoId);

  // Use secure playback URL if available, otherwise fall back to deprecated src prop
  const src = videoId ? playbackUrl : srcProp;
  const poster = securePosterUrl || posterProp || thumbnailUrl;

  // Set error state if playback URL fetch fails
  useEffect(() => {
    if (videoId && playbackError) {
      setHasError(true);
      setIsLoading(false);
    }
  }, [videoId, playbackError]);

  // Combine loading states
  const isLoadingVideo = isPlaybackLoading || (videoId && !playbackUrl && !playbackError);

  // Initialize HLS or native video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setHasError(false);

    const isHls = src.includes('.m3u8');

    const initHls = async () => {
      if (isHls) {
        const HlsModule = await import('hls.js');
        const HlsClass = HlsModule.default;

        if (HlsClass.isSupported()) {
          const hls = new HlsClass({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (autoplay) {
              void video.play().catch(() => {});
            }
          });

          hls.on(HlsClass.Events.ERROR, (_event: string, data: ErrorData) => {
            if (data.fatal) {
              setHasError(true);
              setIsLoading(false);
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = src;
          video.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (autoplay) {
              void video.play().catch(() => {});
            }
          });
        }
      } else {
        // Non-HLS source
        video.src = src;
        video.addEventListener('loadedmetadata', () => setIsLoading(false));
      }
    };

    void initHls();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoplay]);

  // Update muted state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progressPercent = (video.currentTime / video.duration) * 100;
      setProgress(isNaN(progressPercent) ? 0 : progressPercent);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setIsPlaying(true);
      onPlay?.();
    } else {
      void video.pause();
      setIsPlaying(false);
      onPause?.();
    }
  }, [onPlay, onPause]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void video.requestFullscreen();
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  }, []);

  const handleRetry = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setHasError(false);
      setIsLoading(true);
      video.load();
    }
  }, []);

  // Show/hide controls on hover
  const handleMouseEnter = () => {
    if (variant !== 'reels') {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  };

  const handleMouseLeave = () => {
    if (variant !== 'reels') {
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden bg-black',
        variant === 'reels' ? 'h-full w-full' : 'aspect-video w-full',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        poster={poster || undefined}
        loop={loop}
        playsInline
        className="h-full w-full object-contain"
        onClick={togglePlay}
      />

      {/* Loading State */}
      {(isLoading || isLoadingVideo) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
          <p className="mb-3 text-sm">{playbackError?.message || 'Failed to load video'}</p>
          {!playbackError && (
            <button
              onClick={handleRetry}
              className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm hover:bg-white/30"
            >
              Retry
            </button>
          )}
          {playbackError && videoId && (
            <p className="text-xs text-white/60">
              {playbackError.message.includes('Access denied')
                ? 'Please subscribe or purchase to view this video'
                : 'Unable to load video playback'}
            </p>
          )}
        </div>
      )}

      {/* Play/Pause Overlay (Reels variant) */}
      {variant === 'reels' && !isLoading && !hasError && (
        <button
          onClick={togglePlay}
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-opacity',
            isPlaying ? 'opacity-0' : 'opacity-100'
          )}
        >
          <div className="rounded-full bg-black/40 p-4 backdrop-blur-sm">
            <Play className="h-12 w-12 text-white" fill="white" />
          </div>
        </button>
      )}

      {/* Controls Bar */}
      {variant !== 'reels' && !isLoading && !hasError && (
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 transition-opacity',
            showControls ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* Progress Bar */}
          <div className="mb-2 h-1 cursor-pointer rounded-full bg-white/30" onClick={handleSeek}>
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-primary">
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5" fill="currentColor" />
              )}
            </button>

            <button onClick={toggleMute} className="text-white hover:text-primary">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <span className="text-xs text-white/80">
              {videoRef.current ? formatTime(videoRef.current.currentTime) : '0:00'}
              {' / '}
              {duration ? formatTime(duration) : '0:00'}
            </span>

            <div className="flex-1" />

            <button onClick={toggleFullscreen} className="text-white hover:text-primary">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mute Toggle (Reels variant - top right) */}
      {variant === 'reels' && !isLoading && !hasError && (
        <button
          onClick={toggleMute}
          className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm hover:bg-black/60"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {/* Watermark Overlay (Anti-Piracy) */}
      {!isLoading && !hasError && watermarkText && (
        <VideoWatermark text={watermarkText} variant={variant} />
      )}
    </div>
  );
}
