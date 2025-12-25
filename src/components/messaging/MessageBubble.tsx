import { Check, CheckCheck, Loader2, Lock } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency } from '@/lib/utils';
import { Message } from '@/types/messaging';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;

  onUnlock?: (messageId: string) => Promise<void>;
}

export function MessageBubble({ message, isSelf, onUnlock }: MessageBubbleProps) {
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
        <div className="max-w-[70%] space-y-3 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="font-medium">Locked Message</span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Unlock to view this message.</p>
            <Button onClick={handleUnlock} disabled={unlocking} className="w-full">
              {unlocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unlock for {formatCurrency(message.ppvPrice || 0)}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex w-full', isSelf ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] space-y-2 rounded-lg px-4 py-2',
          isSelf ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        {message.media && message.media.length > 0 && (
          <div className="mb-2 overflow-hidden rounded-md">
            {/* Simple image rendering for MVP */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.media?.[0]?.processedUrl || message.media?.[0]?.originalUrl}
              alt="Attachment"
              className="h-auto max-w-full"
            />
          </div>
        )}

        {message.content && <p className="text-sm">{message.content}</p>}

        <div
          className={cn(
            'flex items-center justify-end gap-1 text-[10px]',
            isSelf ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {isSelf && (
            <span>
              {message.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
