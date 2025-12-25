import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { WalletPageContainer } from '@/components/containers/wallet/WalletPageContainer';
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

  return (
    <div className="container max-w-4xl space-y-6 px-4 py-4 sm:px-6 sm:py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Manage your funds and view your transaction history.
        </p>
      </div>

      <WalletPageContainer />
    </div>
  );
}
