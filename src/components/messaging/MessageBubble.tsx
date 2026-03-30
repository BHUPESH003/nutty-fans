import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import type { Message } from '@/types/messaging';

import { MediaViewerModal } from '../media/MediaViewerModal';

import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  avatarUrl?: string | null;
  avatarName?: string;

  onUnlock?: (messageId: string) => Promise<void>;
  onRetry?: (message: Message) => Promise<void> | void;
  onReact?: (messageId: string, emoji: string) => Promise<void> | void;
}

export function MessageBubble({
  message,
  isSelf,
  avatarUrl,
  avatarName,
  onUnlock,
  onRetry,
  onReact,
}: MessageBubbleProps) {
  const [unlocking, setUnlocking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { toast } = useToast();

  const REACTION_EMOJIS = ['❤️', '🔥', '💰', '😍', '👏', '😂'];
  const reactions = message.reactions ?? [];
  const mediaItems = message.media ?? [];
  const visualMedia = mediaItems.filter((media) => media.mediaType !== 'audio');
  const hasVisualMedia = visualMedia.length > 0;

  const isTipMessage = message.messageType === 'tip';
  const isAudioMessage = message.messageType === 'audio' || mediaItems[0]?.mediaType === 'audio';
  const normalizedContent = (message.content || '').trim().toLowerCase();
  const isAutoMediaLabel = normalizedContent === 'video' || normalizedContent === 'image';
  const hasTextContent = Boolean(
    !isAudioMessage && message.content && message.content.trim().length && !isAutoMediaLabel
  );
  const shouldUseChatBubbleBg = !hasVisualMedia || hasTextContent || isAudioMessage;

  if (isTipMessage) {
    const amountRaw = message.metadata?.['amount'];
    const amountNum =
      typeof amountRaw === 'number'
        ? amountRaw
        : typeof amountRaw === 'string'
          ? Number(amountRaw)
          : 0;
    const noteRaw = message.metadata?.['note'];
    const note = typeof noteRaw === 'string' ? noteRaw : undefined;

    return (
      <div className={cn('flex w-full flex-col items-center py-4')}>
        <div className="flex w-64 flex-col items-center gap-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              volunteer_activism
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-secondary">
              {isSelf ? 'You sent a tip' : 'Fan sent a tip'}
            </h4>
            <p className="text-2xl font-black text-on-surface">${amountNum.toFixed(2)}</p>
          </div>

          {note && <p className="text-xs italic text-on-surface-variant">&quot;{note}&quot;</p>}
        </div>
      </div>
    );
  }
  const counts = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  const handleUnlock = async () => {
    if (!onUnlock || !message.id) return;
    try {
      setUnlocking(true);
      await onUnlock(message.id);
      toast({
        title: 'Message unlocked',
        description: 'You can now view this message.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to unlock message',
        description:
          error instanceof Error ? error.message : 'Insufficient balance or an error occurred',
        variant: 'destructive' as const,
      });
    } finally {
      setUnlocking(false);
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    try {
      setRetrying(true);
      await onRetry(message);
    } catch (error) {
      toast({
        title: 'Failed to retry message',
        description: error instanceof Error ? error.message : 'An error occurred while retrying',
        variant: 'destructive' as const,
      });
    } finally {
      setRetrying(false);
    }
  };

  if (message.isLocked) {
    return (
      <div className={cn('flex w-full', isSelf ? 'justify-end' : 'justify-start')}>
        {!isSelf ? (
          <Avatar className="mr-2 mt-auto h-8 w-8">
            <AvatarImage src={avatarUrl || ''} className="object-cover" />
            <AvatarFallback>{avatarName?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
        ) : null}
        <div className="flex max-w-[78%] flex-col gap-3 overflow-hidden rounded-[22px] border border-surface-container-high bg-surface-container-low p-4">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[20px]">lock</span>
            <span className="text-sm font-bold">
              Unlock for {formatCurrency(message.ppvPrice || 0)}
            </span>
          </div>
          <Button
            onClick={handleUnlock}
            disabled={unlocking}
            size="sm"
            className="w-fit rounded-full bg-primary-container px-4 py-2 text-xs font-bold text-white"
          >
            {unlocking && (
              <span className="material-symbols-outlined mr-1 animate-spin text-[14px]">
                progress_activity
              </span>
            )}
            Unlock
          </Button>
        </div>
      </div>
    );
  }

  const viewerItems = visualMedia
    .map((media) => {
      const src =
        media.mediaType === 'video'
          ? media.originalUrl || media.processedUrl
          : media.processedUrl || media.originalUrl;
      if (!src) return null;
      return {
        type: media.mediaType === 'video' ? ('video' as const) : ('image' as const),
        src,
        poster: media.thumbnailUrl,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const openMediaViewer = (
    media: {
      mediaType: string;
      originalUrl?: string | null;
      processedUrl?: string | null;
      thumbnailUrl?: string | null;
    },
    index: number
  ) => {
    const src =
      media.mediaType === 'video'
        ? media.originalUrl || media.processedUrl
        : media.processedUrl || media.originalUrl;
    if (!src) return;

    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className={cn('flex w-full', isSelf ? 'justify-end' : 'justify-start')}>
      {!isSelf ? (
        <Avatar className="mr-2 mt-auto h-8 w-8">
          <AvatarImage src={avatarUrl || ''} className="object-cover" />
          <AvatarFallback>{avatarName?.[0] ?? '?'}</AvatarFallback>
        </Avatar>
      ) : null}
      <div
        className={cn(
          'relative max-w-[78%] space-y-2 text-sm',
          shouldUseChatBubbleBg
            ? cn(
                'rounded-[22px] px-4 py-3',
                isSelf
                  ? 'rounded-br-[4px] bg-primary-container text-white'
                  : 'rounded-bl-[4px] bg-surface-container-lowest text-on-surface shadow-card'
              )
            : 'px-0 py-0 text-on-surface'
        )}
        onMouseEnter={() => onReact && setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        {onReact && showPicker && (
          <div
            className={`absolute ${
              isSelf ? 'right-0' : 'left-0'
            } -top-10 z-10 flex items-center gap-1 rounded-full border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 shadow-modal`}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  void onReact(message.id, emoji);
                  setShowPicker(false);
                }}
                className="text-lg transition-transform hover:scale-125 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {isAudioMessage && mediaItems.length > 0
          ? (() => {
              const src = mediaItems[0]?.processedUrl || mediaItems[0]?.originalUrl;
              const durationRaw = message.metadata?.['duration'];
              const duration =
                typeof durationRaw === 'number'
                  ? durationRaw
                  : typeof durationRaw === 'string'
                    ? Number(durationRaw)
                    : 0;

              return src ? (
                <div className="mb-2">
                  <VoiceMessagePlayer src={src} duration={duration} isMine={isSelf} />
                </div>
              ) : null;
            })()
          : visualMedia.length > 0 && (
              <div
                className={cn(
                  'mb-2 grid gap-2',
                  visualMedia.length > 1
                    ? 'w-[min(78vw,340px)] grid-cols-2 md:w-[360px]'
                    : 'w-[min(78vw,280px)] grid-cols-1 md:w-[320px]'
                )}
              >
                {visualMedia.map((media, index) => {
                  const imageSrc = media.processedUrl || media.originalUrl;
                  const videoSrc = media.originalUrl || media.processedUrl;
                  if (!imageSrc && !videoSrc) return null;

                  return media.mediaType === 'video' ? (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => openMediaViewer(media, index)}
                      className={cn(
                        'overflow-hidden rounded-xl bg-black/90 text-left',
                        visualMedia.length > 1
                          ? 'aspect-square h-auto w-full'
                          : 'aspect-[4/5] h-auto w-full'
                      )}
                    >
                      <video
                        src={videoSrc || undefined}
                        poster={media.thumbnailUrl || undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full rounded-xl bg-black object-cover"
                      />
                    </button>
                  ) : (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => openMediaViewer(media, index)}
                      className={cn(
                        'overflow-hidden rounded-xl',
                        visualMedia.length > 1
                          ? 'aspect-square h-auto w-full'
                          : 'aspect-[4/5] h-auto w-full'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc || ''}
                        alt="Attachment"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

        {!isAudioMessage && hasTextContent && <p>{message.content}</p>}

        {reactions.length > 0 && (
          <div className={`mt-1 flex flex-wrap gap-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(counts).map(([emoji, count]) =>
              onReact ? (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    void onReact(message.id, emoji);
                  }}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all ${
                    isSelf
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-surface-container-high bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{count}</span>
                </button>
              ) : (
                <span key={emoji} className="text-xs text-on-surface-variant">
                  {emoji} {count}
                </span>
              )
            )}
          </div>
        )}

        <div
          className={cn(
            'flex items-center justify-end gap-1 text-[10px]',
            isSelf ? 'text-white/80' : 'text-on-surface-variant'
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {isSelf && (
            <span className="material-symbols-outlined text-[12px] opacity-70">
              {(() => {
                const status = message.status ?? (message.isRead ? 'READ' : 'SENT');
                if (status === 'SENDING') return 'schedule';
                if (status === 'SENT') return 'check';
                if (status === 'DELIVERED' || status === 'READ') return 'done_all';
                if (status === 'FAILED') return 'error';
                return message.isRead ? 'done_all' : 'done';
              })()}
            </span>
          )}
        </div>

        {isSelf && message.status === 'FAILED' && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="mt-1 flex w-fit items-center gap-1 text-[10px] font-bold text-error"
            type="button"
          >
            <span className="material-symbols-outlined text-[12px]">refresh</span>
            {retrying ? 'Retrying…' : 'Tap to retry'}
          </button>
        )}

        <MediaViewerModal
          open={viewerOpen}
          items={viewerItems}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      </div>
    </div>
  );
}
