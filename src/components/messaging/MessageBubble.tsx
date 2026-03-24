import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { Message } from '@/types/messaging';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  avatarUrl?: string | null;
  avatarName?: string;

  onUnlock?: (messageId: string) => Promise<void>;
}

export function MessageBubble({
  message,
  isSelf,
  avatarUrl,
  avatarName,
  onUnlock,
}: MessageBubbleProps) {
  const [unlocking, setUnlocking] = useState(false);
  const { toast } = useToast();

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
          'max-w-[78%] space-y-2 rounded-[22px] px-4 py-3 text-sm',
          isSelf
            ? 'rounded-br-[4px] bg-primary-container text-white'
            : 'rounded-bl-[4px] bg-surface-container-lowest text-on-surface shadow-card'
        )}
      >
        {message.media && message.media.length > 0 && (
          <div className="mb-2 overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.media?.[0]?.processedUrl || message.media?.[0]?.originalUrl}
              alt="Attachment"
              className="h-auto max-w-full"
            />
          </div>
        )}

        {message.content && <p>{message.content}</p>}

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
            <span className="material-symbols-outlined text-[12px]">
              {message.isRead ? 'done_all' : 'done'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
