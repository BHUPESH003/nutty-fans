'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LowBalanceModalProps {
  open: boolean;
  onOpenChange: (_value: boolean) => void;
  message?: string;
  requiredAmount?: number;
  currentBalance?: number;
}

export function LowBalanceModal({
  open,
  onOpenChange,
  message,
  requiredAmount,
  currentBalance,
}: LowBalanceModalProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleAddFunds = () => {
    setIsNavigating(true);
    // Close modal first
    onOpenChange(false);
    // Use router.push for client-side navigation (better UX, preserves state)
    router.push('/account/wallet' as Route);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const displayMessage =
    message ||
    (requiredAmount && currentBalance !== undefined
      ? `You need $${requiredAmount.toFixed(2)} but your current balance is $${currentBalance.toFixed(2)}. Please add funds to your wallet to continue.`
      : 'Your wallet balance is insufficient. Please add funds to continue.');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insufficient Balance</DialogTitle>
          <DialogDescription className="pt-2">{displayMessage}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
          <Button variant="outline" onClick={handleCancel} disabled={isNavigating}>
            Cancel
          </Button>
          <Button onClick={handleAddFunds} disabled={isNavigating}>
            {isNavigating ? 'Loading...' : 'Add Funds to Wallet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
