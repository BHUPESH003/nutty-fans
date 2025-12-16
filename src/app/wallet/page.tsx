import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { TransactionList } from '@/components/payments/TransactionList';
import { authOptions } from '@/lib/auth/authOptions';

export const metadata: Metadata = {
  title: 'My Wallet | NuttyFans',
  description: 'Manage your wallet balance and view transaction history.',
};

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  // Fetch data on server
  // Note: We need to handle the response format from controller which returns NextResponse
  // In a real app we might separate the service logic from the controller logic to reuse it here
  // But for now we'll call the service directly or use a helper
  // Actually, calling controller methods directly returns NextResponse, which is not ideal for server components
  // I should use the Service directly here.

  const { WalletService } = await import('@/services/payments/walletService');
  const walletService = new WalletService();
  const balance = await walletService.getBalance(session.user.id);
  const history = await walletService.getTransactions(session.user.id);

  // We need to create a client wrapper for the topup action
  // But WalletCard handles the API call internally via fetch
  // So we just pass the initial balance and a revalidate action?
  // Or just let WalletCard handle the state and we refresh the page?

  return (
    <div className="container max-w-4xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">
          Manage your funds and view your transaction history.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <WalletClientWrapper initialBalance={balance.balance} />
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
          <TransactionList transactions={history.transactions} />
        </div>
      </div>
    </div>
  );
}

// Client wrapper to handle topup interactions
import { WalletClientWrapper } from './client';
