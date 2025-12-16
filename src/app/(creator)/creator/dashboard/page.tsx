'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardMetrics {
  totalRevenue: number;
  subscriberCount: number;
  followerCount: number;
  profileViews: number;
  pendingPayout: number;
  nextPayoutDate: string | null;
  accountStatus: 'pending_kyc' | 'pending_payout_setup' | 'active' | 'suspended';
}

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    void fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/creator/dashboard?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else if (response.status === 404) {
        router.push('/creator/apply');
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Unable to load dashboard</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground">Track your earnings and audience</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All Time' : p}
            </Button>
          ))}
        </div>
      </div>

      {metrics.accountStatus !== 'active' && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {metrics.accountStatus === 'pending_kyc' && 'Complete identity verification'}
                  {metrics.accountStatus === 'pending_payout_setup' && 'Set up your payout method'}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {metrics.accountStatus === 'pending_kyc' &&
                    'Verify your identity to start earning'}
                  {metrics.accountStatus === 'pending_payout_setup' &&
                    'Connect your payment account to receive payouts'}
                </p>
              </div>
              <Button asChild>
                <Link
                  href={
                    metrics.accountStatus === 'pending_kyc'
                      ? '/creator/verify'
                      : '/creator/payouts/setup'
                  }
                >
                  Complete Setup
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(metrics.totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Subscribers</CardDescription>
            <CardTitle className="text-2xl">{metrics.subscriberCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Followers</CardDescription>
            <CardTitle className="text-2xl">{metrics.followerCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profile Views</CardDescription>
            <CardTitle className="text-2xl">{metrics.profileViews}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payout</CardTitle>
            <CardDescription>
              Next payout:{' '}
              {metrics.nextPayoutDate ? formatDate(metrics.nextPayoutDate) : 'Not scheduled'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(metrics.pendingPayout)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Minimum $20 required for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/creator/profile/edit">Edit Profile</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/creator/subscription">Subscription Settings</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/creator/payouts">Payout History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
