import { Settings } from 'lucide-react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authOptions } from '@/lib/auth/authOptions';
import { formatCurrency, formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Payouts | NuttyFans Creator',
  description: 'View your payout history.',
};

export default async function PayoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const { paymentController } = await import('@/app/api/_controllers/paymentController');
  const creator = await paymentController.getCreatorProfile(session.user.id);
  if (!creator) {
    redirect('/creator/onboarding' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const { PayoutService } = await import('@/services/payments/payoutService');
  const payoutService = new PayoutService();
  const result = await payoutService.getPayouts(creator.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-muted-foreground">History of transfers to your bank account.</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/creator/payouts/settings">
            <Settings className="mr-2 h-4 w-4" />
            Payout Settings
          </a>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.payouts.map((payout) => (
              <TableRow key={payout.id}>
                <TableCell>{formatDate(payout.createdAt)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                <TableCell>
                  <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>
                    {payout.status}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">{payout.payoutMethod}</TableCell>
              </TableRow>
            ))}
            {result.payouts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No payouts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
