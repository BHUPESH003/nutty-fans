'use client';

import { Loader2, Wallet, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface WalletCardProps {
  balance: number;
  // eslint-disable-next-line no-unused-vars
  onTopup: (amount: number) => Promise<void>;
}

export function WalletCard({ balance, onTopup }: WalletCardProps) {
  const [amount, setAmount] = useState<string>('10');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // eslint-disable-next-line no-unused-vars
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Balance
        </CardTitle>
        <CardDescription>Use your wallet for instant purchases and tips.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="text-4xl font-bold">{formatCurrency(balance)}</div>

          <div className="space-y-4">
            <Label>Add Funds</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="5"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-6"
                  placeholder="Amount"
                />
              </div>
              <Button onClick={() => handleTopUp(parseFloat(amount))} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Top Up
              </Button>
            </div>
            <div className="flex gap-2 text-sm">
              <Button variant="outline" size="sm" onClick={() => setAmount('10')}>
                $10
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAmount('25')}>
                $25
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAmount('50')}>
                $50
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAmount('100')}>
                $100
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
