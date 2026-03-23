import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSend: (_content: string, _mediaId?: string, _price?: number) => Promise<void>;
  isCreator: boolean;
  disabled?: boolean;
}

export function MessageInput({ onSend, isCreator, disabled: _disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // MVP: No real media upload yet, just placeholder logic
  // In real app: Use MediaUpload component to get mediaId

  const handleSend = async () => {
    if (!content.trim()) return;

    try {
      setSending(true);
      await onSend(content, undefined, price);
      setContent('');
      setPrice(0);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to send message',
        description:
          error instanceof Error ? error.message : 'An error occurred while sending your message',
        variant: 'destructive' as const,
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-surface-container-high bg-white/90 p-4 backdrop-blur-xl">
      {price > 0 && (
        <div className="mb-2 flex w-fit items-center gap-2 rounded-md bg-secondary-fixed/10 p-2 text-sm text-secondary">
          <span className="material-symbols-outlined text-[18px]">toll</span>
          <span>Locked for ${price}</span>
          <button type="button" onClick={() => setPrice(0)} className="hover:text-secondary">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex gap-1 pb-2">
          {/* Media Upload Trigger (Placeholder) */}
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" disabled>
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
              image
            </span>
          </Button>

          {isCreator && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                    toll
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Set Price</h4>
                  <p className="text-sm text-muted-foreground">
                    Lock this message behind a paywall.
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-full border-none bg-surface-container-low px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-primary-fixed"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          size="icon"
          className="h-10 w-10 shrink-0 rounded-full bg-primary-container text-white hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </Button>
      </div>
    </div>
  );
}
