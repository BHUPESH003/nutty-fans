'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { TransactionList } from '@/components/payments/TransactionList';
import { WalletCard } from '@/components/payments/WalletCard';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';

export function WalletPageContainer() {
  const { toast } = useToast();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const [bal, tx] = await Promise.all([
        apiClient.wallet.getBalance(),
        apiClient.wallet.getTransactions(),
      ]);
      setBalance(bal.balance);
      setTransactions(tx.transactions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load wallet';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTopup = async (amount: number) => {
    const res = await apiClient.wallet.topup(amount);
    if (res.checkoutUrl) {
      window.location.href = res.checkoutUrl;
      return;
    }
    throw new Error('No checkout URL received from server');
  };

  if (isLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <WalletCard balance={balance} onTopup={handleTopup} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold sm:text-xl">Recent Transactions</h2>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}
