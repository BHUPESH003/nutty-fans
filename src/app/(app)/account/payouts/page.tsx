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
import { creatorAccessService } from '@/services/creator/creatorAccess';

export default async function AccountPayoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  let creatorId: string;
  try {
    creatorId = await creatorAccessService.requireCreatorIdByUserId(session.user.id);
  } catch {
    return (
      <div className="rounded-2xl border border-border bg-surface-container-low p-6 text-sm text-on-surface-variant">
        Creator profile not found.
      </div>
    );
  }

  const { PayoutService } = await import('@/services/payments/payoutService');
  const payoutService = new PayoutService();
  const result = await payoutService.getPayouts(creatorId);

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface md:text-3xl">Payouts</h1>
          <p className="text-sm text-on-surface-variant">
            History of transfers to your bank account.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/creator/payouts/settings">
            <span className="material-symbols-outlined mr-2 text-[18px]">settings</span>
            Payout Settings
          </a>
        </Button>
      </div>

      <div className="w-full min-w-0 overflow-x-auto rounded-2xl border border-border bg-background">
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
