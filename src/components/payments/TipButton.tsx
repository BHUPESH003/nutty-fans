'use client';

import { Heart, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/apiClient';

interface TipButtonProps {
  creatorId: string;
  creatorName: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export function TipButton({
  creatorId,
  creatorName,
  variant = 'default',
  size,
  className,
}: TipButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount.toString());
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) < 1) {
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.payments.sendTip({
        creatorId,
        amount: parseFloat(amount),
        message: message.trim() || undefined,
        paymentSource: 'wallet',
      });
      setIsOpen(false);
      setAmount('');
      setMessage('');
      // Success toast is handled by API client interceptor
    } catch (error) {
      console.error('Failed to send tip:', error);
      // Error toast is handled by API client interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericAmount = parseFloat(amount) || 0;
  const isValid = numericAmount >= 1 && numericAmount <= 500;

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setIsOpen(true)} className={className}>
        <Heart className="mr-2 h-4 w-4" />
        Tip
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send a Tip</DialogTitle>
            <DialogDescription>
              Show your appreciation to {creatorName}. Tips start at $1.00.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max="500"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Minimum $1.00, Maximum $500.00</p>
            </div>

            <div className="space-y-2">
              <Label>Quick Amounts</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === preset.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    type="button"
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Say something nice..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send ${numericAmount.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
