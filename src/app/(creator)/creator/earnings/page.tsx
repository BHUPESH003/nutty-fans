import { DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authOptions } from '@/lib/auth/authOptions';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Earnings | NuttyFans Creator',
  description: 'View your earnings and revenue breakdown.',
};

export default async function EarningsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const { paymentController } = await import('@/app/api/_controllers/paymentController');

  // Get creator profile first
  const creator = await paymentController.getCreatorProfile(session.user.id);
  if (!creator) {
    redirect('/creator/onboarding' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  // Get earnings data directly from service to avoid NextResponse wrapping if possible,
  // but controller returns NextResponse.
  // I should use the service directly.
  const { PayoutService } = await import('@/services/payments/payoutService');
  const payoutService = new PayoutService();
  const earnings = await payoutService.getEarningsSummary(creator.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">Overview of your revenue and payouts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(earnings.pendingPayout)}</div>
            <p className="text-xs text-muted-foreground">Available for next payout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.transactionCount}</div>
            <p className="text-xs text-muted-foreground">Total payments received</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Earnings by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(earnings.byType).map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                  </div>
                  <div className="font-medium">{formatCurrency(amount)}</div>
                </div>
              ))}
              {Object.keys(earnings.byType).length === 0 && (
                <p className="text-sm text-muted-foreground">No earnings yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
