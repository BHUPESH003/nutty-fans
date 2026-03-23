'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/apiClient';

interface DashboardMetrics {
  totalRevenue: string;
  subscriberCount: number;
  profileViews: number;
  pendingPayout: string;
  nextPayoutDate: string;
}

interface ConnectionStatus {
  isConnected: boolean;
}

export const CreatorDashboardContainer = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutConnected, setPayoutConnected] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await apiClient.creator.getDashboard()) as any;
        setMetrics(data);

        // Check payout connection status
        try {
          const status: ConnectionStatus = await apiClient.creator.getSquareStatus();
          setPayoutConnected(status.isConnected);
        } catch {
          // Ignore - defaults to not connected
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Dashboard"
        subtitle="Manage your content and earnings"
        showBack={false}
        actions={
          <Button asChild>
            <Link href="/creator/posts/new">
              <span className="material-symbols-outlined mr-2 text-[18px]">add</span>
              Create Post
            </Link>
          </Button>
        }
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href="/creator/posts/new">
            <span className="material-symbols-outlined h-4 w-4 text-[20px] text-primary">add</span>
            <span className="text-xs">New Post</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href="/creator/posts">
            <span className="material-symbols-outlined text-[20px] text-secondary">article</span>
            <span className="text-xs">My Posts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href="/creator/earnings">
            <span className="material-symbols-outlined text-[20px] text-secondary">
              trending_up
            </span>
            <span className="text-xs">Earnings</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href={'/creator/bundles' as Route}>
            <span className="material-symbols-outlined text-[20px] text-primary">inventory_2</span>
            <span className="text-xs">Bundles</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href={'/creator/live' as Route}>
            <span className="material-symbols-outlined text-[20px] text-tertiary">videocam</span>
            <span className="text-xs">Go Live</span>
          </Link>
        </Button>
        {payoutConnected ? (
          <Button variant="outline" className="h-auto flex-col gap-1 py-3 text-secondary" disabled>
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="text-xs">Payouts ✓</span>
          </Button>
        ) : (
          <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
            <Link href="/creator/payouts/setup">
              <span className="material-symbols-outlined text-[20px] text-primary">settings</span>
              <span className="text-xs">Setup Payouts</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="rounded-[20px] p-5 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Total Revenue</span>
            <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
          </div>
          <div className="font-headline text-2xl font-black">
            ${metrics?.totalRevenue || '0.00'}
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">Lifetime earnings</p>
        </Card>
        <Card className="rounded-[20px] p-5 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Subscribers</span>
            <span className="material-symbols-outlined text-[18px] text-secondary">group</span>
          </div>
          <div className="font-headline text-2xl font-black">{metrics?.subscriberCount || 0}</div>
          <p className="mt-1 text-xs text-on-surface-variant">Active subscribers</p>
        </Card>
        <Card className="rounded-[20px] p-5 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Profile Views</span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              visibility
            </span>
          </div>
          <div className="font-headline text-2xl font-black">{metrics?.profileViews || 0}</div>
          <p className="mt-1 text-xs text-on-surface-variant">This month</p>
        </Card>
        <Card className="rounded-[20px] p-5 shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">Pending Payout</span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              credit_card
            </span>
          </div>
          <div className="font-headline text-2xl font-black">
            ${metrics?.pendingPayout || '0.00'}
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Next:{' '}
            {metrics?.nextPayoutDate
              ? new Date(metrics.nextPayoutDate).toLocaleDateString()
              : 'N/A'}
          </p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[250px] items-center justify-center text-sm text-on-surface-variant">
              Chart coming soon
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-base">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[250px] items-center justify-center text-sm text-on-surface-variant">
              No recent sales
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
