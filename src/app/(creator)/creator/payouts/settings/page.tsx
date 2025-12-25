import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { authOptions } from '@/lib/auth/authOptions';
import { creatorAccessService } from '@/services/creator/creatorAccess';

export const metadata: Metadata = {
  title: 'Payout Settings | NuttyFans Creator',
  description: 'Configure your payout preferences.',
};

export default async function PayoutSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  let creatorId: string;
  try {
    creatorId = await creatorAccessService.requireCreatorIdByUserId(session.user.id);
  } catch {
    redirect('/creator/onboarding' as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  const { PayoutService } = await import('@/services/payments/payoutService');
  const payoutService = new PayoutService();
  const settings = await payoutService.getSettings(creatorId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payout Settings</h1>
        <p className="text-muted-foreground">Manage how and when you get paid.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout Schedule</CardTitle>
          <CardDescription>Payouts are processed weekly on Fridays.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="auto-payout">Automatic Payouts</Label>
              <p className="text-sm text-muted-foreground">
                Automatically transfer earnings to your bank account weekly.
              </p>
            </div>
            <Switch id="auto-payout" checked={settings.autoPayoutEnabled} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="min-payout">Minimum Payout Amount ($)</Label>
            <Input
              id="min-payout"
              type="number"
              value={settings.minimumAmount}
              disabled
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Minimum amount required to trigger a payout.
            </p>
          </div>

          <div className="pt-4">
            <Button variant="outline" disabled>
              Save Changes (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Account</CardTitle>
          <CardDescription>Your connected bank account via Square.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="font-bold text-muted-foreground">SQ</span>
              </div>
              <div>
                <div className="font-medium">Square Account</div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href="/creator/onboarding">Manage</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
