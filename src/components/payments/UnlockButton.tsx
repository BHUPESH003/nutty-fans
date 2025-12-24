'use client';

import { Lock, Wallet, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';

interface UnlockButtonProps {
  postId: string;
  price: number;
  onSuccess?: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export function UnlockButton({
  postId,
  price,
  onSuccess,
  variant = 'default',
  className,
}: UnlockButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = async () => {
    setIsOpen(true);
    try {
      // Fetch wallet balance
      const status = await apiClient.payments.getStatus();
      setWalletBalance(status.walletBalance);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch wallet balance',
        variant: 'destructive',
      });
    }
  };

  const handleUnlock = async () => {
    if (walletBalance !== null && walletBalance < price) {
      toast({
        title: 'Insufficient Balance',
        description: `You need $${price.toFixed(2)} but only have $${walletBalance.toFixed(2)}. Please add funds to your wallet.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.payments.unlockPpv(postId);
      toast({
        title: 'Content Unlocked!',
        description: 'You now have access to this content.',
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Unlock Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasSufficientBalance = walletBalance !== null && walletBalance >= price;

  if (variant === 'compact') {
    return (
      <Button size="sm" onClick={handleOpenDialog} className={className}>
        <Lock className="mr-1.5 h-3.5 w-3.5" />${price.toFixed(2)}
      </Button>
    );
  }

  return (
    <>
      <Button size="lg" onClick={handleOpenDialog} className={className}>
        <Lock className="mr-2 h-4 w-4" />
        Unlock for ${price.toFixed(2)}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock Premium Content</DialogTitle>
            <DialogDescription>
              This content costs ${price.toFixed(2)} to unlock. Once purchased, you&apos;ll have
              permanent access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Price Summary */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Content Price</span>
                <span className="font-semibold">${price.toFixed(2)}</span>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Wallet Balance</span>
              </div>
              <span
                className={
                  hasSufficientBalance
                    ? 'font-semibold text-green-500'
                    : 'font-semibold text-red-500'
                }
              >
                {walletBalance !== null ? `$${walletBalance.toFixed(2)}` : '...'}
              </span>
            </div>

            {!hasSufficientBalance && walletBalance !== null && (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  You need ${(price - walletBalance).toFixed(2)} more. Add funds to your wallet
                  first.
                </p>
              </div>
            )}

            {/* After Purchase */}
            {hasSufficientBalance && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Balance after purchase</span>
                <span>${(walletBalance - price).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            {hasSufficientBalance ? (
              <Button onClick={handleUnlock} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Unlock'
                )}
              </Button>
            ) : (
              <Button asChild className="flex-1">
                <a href="/wallet">Add Funds</a>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
