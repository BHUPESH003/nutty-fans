'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface WalletCardProps {
  balance: number;

  onTopup: (amount: number) => Promise<void>;
}

export function WalletCard({ balance, onTopup }: WalletCardProps) {
  const [amount, setAmount] = useState<string>('10');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTopUp = async (_amount: number) => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 5) {
      toast({
        title: 'Invalid amount',
        description: 'Minimum top-up is $5.00',
      });
      return;
    }

    try {
      setLoading(true);
      await onTopup(val);
      setAmount('');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Please enter a valid amount (minimum $5)',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary-container text-white shadow-ambient">
      <CardHeader className="px-4 pb-3 pt-5 sm:px-6">
        <CardTitle className="flex items-center gap-2 font-headline text-lg text-white sm:text-xl">
          <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          Wallet Balance
        </CardTitle>
        <CardDescription className="text-sm text-white/80">
          Use your wallet for instant purchases and tips.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-5 sm:px-6">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm opacity-80">Available Balance</p>
            <div className="break-words font-headline text-3xl font-black sm:text-4xl">
              {formatCurrency(balance)}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-white/90">Add Funds</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-white/80">$</span>
                <Input
                  type="number"
                  min="5"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border-white/20 bg-white/10 pl-6 text-white placeholder:text-white/50"
                  placeholder="Amount"
                />
              </div>
              <Button
                onClick={() => handleTopUp(parseFloat(amount))}
                disabled={loading}
                variant="secondary"
                className="w-full border-0 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 sm:w-auto"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined mr-2 text-[18px]">add</span>
                )}
                Top Up
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                onClick={() => setAmount('10')}
              >
                $10
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                onClick={() => setAmount('25')}
              >
                $25
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                onClick={() => setAmount('50')}
              >
                $50
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
                onClick={() => setAmount('100')}
              >
                $100
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
