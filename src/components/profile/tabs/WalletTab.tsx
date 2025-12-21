'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TransactionList } from '@/components/payments/TransactionList';
import { WalletCard } from '@/components/payments/WalletCard';
import { apiClient } from '@/services/apiClient';

export function WalletTab() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [balanceData, historyData] = await Promise.all([
        apiClient.wallet.getBalance(),
        apiClient.wallet.getTransactions(),
      ]);
      setBalance(balanceData.balance);
      setTransactions(historyData.transactions);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleTopup = async (amount: number) => {
    try {
      const data = await apiClient.wallet.topup(amount);
      setBalance(data.balance);
      router.refresh();
      void loadData(); // Reload transactions
    } catch (error) {
      console.error('Topup failed:', error);
      alert('Topup failed');
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading wallet...</div>;
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
      <div className="space-y-6">
        <WalletCard balance={balance} onTopup={handleTopup} />
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}
