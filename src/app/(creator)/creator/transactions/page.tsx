import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { TransactionList } from '@/components/payments/TransactionList';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth/authOptions';

export default async function CreatorTransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/creator/transactions');
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
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-4 md:px-6 md:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface md:text-3xl">
            Transactions
          </h1>
          <p className="text-sm text-on-surface-variant">
            Review subscription, payout, tip and wallet activity.
          </p>
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
