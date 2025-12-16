import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authOptions } from '@/lib/auth/authOptions';
import { formatDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Subscribers | NuttyFans Creator',
  description: 'View your active subscribers.',
};

export default async function SubscribersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const { paymentController } = await import('@/app/api/_controllers/paymentController');
  const creator = await paymentController.getCreatorProfile(session.user.id);
  if (!creator) {
    redirect('/creator/onboarding' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const { SubscriptionService } = await import('@/services/payments/subscriptionService');
  const subscriptionService = new SubscriptionService();
  const result = await subscriptionService.getCreatorSubscribers(creator.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscribers</h1>
          <p className="text-muted-foreground">{result.totalCount} active subscribers</p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Renews/Expires</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.subscribers.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={sub.user.avatarUrl || ''} />
                    <AvatarFallback>{sub.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{sub.user.displayName}</div>
                    <div className="text-xs text-muted-foreground">@{sub.user.username}</div>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{sub.planType}</TableCell>
                <TableCell>{formatDate(sub.startedAt)}</TableCell>
                <TableCell>{formatDate(sub.expiresAt)}</TableCell>
                <TableCell>
                  <Badge variant="default">Active</Badge>
                </TableCell>
              </TableRow>
            ))}
            {result.subscribers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No subscribers yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
