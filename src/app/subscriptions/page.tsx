import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';

import { SubscriptionListClient } from './client';

export const metadata: Metadata = {
  title: 'My Subscriptions | NuttyFans',
  description: 'Manage your active subscriptions.',
};

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const { SubscriptionService } = await import('@/services/payments/subscriptionService');
  const subscriptionService = new SubscriptionService();
  const result = await subscriptionService.getUserSubscriptions(session.user.id);

  return (
    <div className="container max-w-4xl space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">Manage your active subscriptions and billing.</p>
      </div>

      <SubscriptionListClient initialSubscriptions={result.subscriptions} />
    </div>
  );
}
