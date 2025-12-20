import { DollarSign, Image as ImageIcon, Send, X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface MessageInputProps {
  // eslint-disable-next-line no-unused-vars
  onSend: (_content: string, _mediaId?: string, _price?: number) => Promise<void>;
  isCreator: boolean;
  disabled?: boolean;
}

// eslint-disable-next-line no-unused-vars
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
    <div className="border-t bg-background p-4">
      {price > 0 && (
        <div className="mb-2 flex w-fit items-center gap-2 rounded-md bg-green-50 p-2 text-sm text-green-600">
          <DollarSign className="h-4 w-4" />
          <span>Locked for ${price}</span>
          <button onClick={() => setPrice(0)} className="hover:text-green-800">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex gap-2 pb-2">
          {/* Media Upload Trigger (Placeholder) */}
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </Button>

          {isCreator && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
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
          className="max-h-[120px] min-h-[40px] resize-none"
          rows={1}
        />

        <Button onClick={handleSend} disabled={!content.trim() || sending} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
