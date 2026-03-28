'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
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

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

interface InChatTipModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  recipientId: string;
  onSent: (amount: number, note?: string) => void;
}

export function InChatTipModal({
  open,
  onClose,
  conversationId,
  recipientId,
  onSent,
}: InChatTipModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const numericAmount = useMemo(() => parseFloat(amount) || 0, [amount]);
  const isValid = numericAmount >= 1 && numericAmount <= 200;

  useEffect(() => {
    if (!open) return;
    void apiClient.wallet
      .getBalance()
      .then(({ balance }) => setWalletBalance(balance))
      .catch(() => {
        setWalletBalance(null);
      });
  }, [open]);

  const handlePreset = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const tipRes = await apiClient.payments.sendTip({
        creatorId: recipientId,
        amount: numericAmount,
        message: note.trim() ? note.trim() : undefined,
        paymentSource: 'wallet',
        conversationId,
      });

      onSent(numericAmount, note.trim() ? note.trim() : undefined);
      onClose();

      // Tip: success toast is handled by API client interceptor.
      return tipRes;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send a Tip</DialogTitle>
          <DialogDescription>Show appreciation and support {recipientId}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-md bg-secondary-fixed/10 p-3">
            <div className="text-sm font-medium">Your balance</div>
            <div className="font-mono text-sm text-on-surface">
              {walletBalance == null ? '...' : `$${walletBalance.toFixed(2)}`}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tip-amount">Amount ($)</Label>
            <Input
              id="tip-amount"
              type="number"
              min="1"
              max="200"
              step="0.01"
              value={amount}
              placeholder="0.00"
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Quick amounts</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={amount === preset.toString() ? 'default' : 'outline'}
                  onClick={() => handlePreset(preset)}
                >
                  ${preset}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tip-note">Note (Optional)</Label>
            <Textarea
              id="tip-note"
              placeholder="Say something nice..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground">{note.length}/500</div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? (
              <span className="material-symbols-outlined mr-2 animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined mr-2">favorite</span>
            )}
            Send ${numericAmount.toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
