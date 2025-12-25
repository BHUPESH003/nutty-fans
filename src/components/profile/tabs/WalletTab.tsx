'use client';

import { useEffect, useState } from 'react';

import { TransactionList } from '@/components/payments/TransactionList';
import { WalletCard } from '@/components/payments/WalletCard';
import { apiClient } from '@/services/apiClient';

export function WalletTab() {
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
      // PaymentService now returns checkoutUrl and checkoutId
      // Redirect user to payment gateway checkout
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Fallback - should not happen but handle gracefully
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Topup failed:', error);
      // Error toast is handled by API client interceptor
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading wallet...</div>;
  }

  return (
    <div className="grid w-full gap-6">
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
