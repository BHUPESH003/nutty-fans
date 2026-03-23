import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { TransactionList } from '@/components/payments/TransactionList';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth/authOptions';

export const metadata: Metadata = {
  title: 'Transactions | NuttyFans',
  description: 'View your complete transaction history.',
};

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const { TransactionService } = await import('@/services/payments/transactionService');
  const transactionService = new TransactionService();
  const history = await transactionService.getUserTransactions(
    session.user.id,
    undefined,
    undefined,
    50
  );

  return (
    <div className="container max-w-4xl space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View your payments, subscriptions, and tips.</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/transactions/export" download>
            <span className="material-symbols-outlined mr-2 text-[18px]">download</span>
            Export CSV
          </a>
        </Button>
      </div>

      <TransactionList transactions={history.transactions} />
    </div>
  );
}
