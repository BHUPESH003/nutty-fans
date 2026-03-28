'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface VoiceMessagePlayerProps {
  src: string;
  duration: number;
  isMine: boolean;
}

const WAVEFORM_HEIGHTS = [
  3, 6, 9, 12, 8, 5, 10, 14, 7, 4, 11, 9, 6, 13, 8, 5, 9, 12, 7, 4, 10, 8, 6, 3,
];

export function VoiceMessagePlayer({ src, duration, isMine }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(new Audio(src));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const safeDuration = useMemo(
    () => (Number.isFinite(duration) && duration > 0 ? duration : 0),
    [duration]
  );

  useEffect(() => {
    const audio = audioRef.current;
    audio.src = src;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    // play() returns a promise; ignore autoplay errors (UI will reflect paused state).
    void audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  return (
    <div
      className={`flex w-64 items-center gap-3 rounded-2xl px-4 py-3 ${
        isMine ? 'bg-primary-container text-white' : 'bg-surface-container-lowest text-on-surface'
      }`}
    >
      <button
        onClick={toggle}
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          isMine ? 'bg-white/20' : 'bg-surface-container-high'
        }`}
        type="button"
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <div className="flex flex-1 items-center gap-0.5">
        {Array.from({ length: 24 }).map((_, i) => {
          const height = WAVEFORM_HEIGHTS[i] ?? 3;
          const ratio = safeDuration > 0 ? currentTime / safeDuration : 0;
          const isActive = i / 24 < ratio;

          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all ${
                isActive
                  ? isMine
                    ? 'bg-white'
                    : 'bg-primary-container'
                  : isMine
                    ? 'bg-white/30'
                    : 'bg-surface-container-high'
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>

      <span
        className={`flex-shrink-0 font-mono text-[10px] ${
          isMine ? 'text-white/70' : 'text-on-surface-variant'
        }`}
      >
        {Math.floor(safeDuration / 60)}:{String(Math.floor(safeDuration % 60)).padStart(2, '0')}
      </span>
    </div>
  );
}
