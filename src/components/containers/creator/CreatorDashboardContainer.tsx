'use client';

import {
  DollarSign,
  Users,
  Eye,
  CreditCard,
  Package,
  Plus,
  FileText,
  TrendingUp,
  Settings,
  CheckCircle,
  Video,
} from 'lucide-react';
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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
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
              <Plus className="mr-2 h-4 w-4" />
              Create Post
            </Link>
          </Button>
        }
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href="/creator/posts/new">
            <Plus className="h-4 w-4 text-primary" />
            <span className="text-xs">New Post</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href="/creator/posts">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="text-xs">My Posts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href="/creator/earnings">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs">Earnings</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href={'/creator/bundles' as Route}>
            <Package className="h-4 w-4 text-purple-500" />
            <span className="text-xs">Bundles</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
          <Link href={'/creator/live' as Route}>
            <Video className="h-4 w-4 text-red-500" />
            <span className="text-xs">Go Live</span>
          </Link>
        </Button>
        {payoutConnected ? (
          <Button variant="outline" className="h-auto flex-col gap-1 py-3 text-green-500" disabled>
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">Payouts ✓</span>
          </Button>
        ) : (
          <Button variant="outline" className="h-auto flex-col gap-1 py-3" asChild>
            <Link href="/creator/payouts/setup">
              <Settings className="h-4 w-4 text-orange-500" />
              <span className="text-xs">Setup Payouts</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Revenue</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">${metrics?.totalRevenue || '0.00'}</div>
          <p className="text-xs text-muted-foreground">Lifetime earnings</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Subscribers</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{metrics?.subscriberCount || 0}</div>
          <p className="text-xs text-muted-foreground">Active subscribers</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Profile Views</span>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">{metrics?.profileViews || 0}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Pending Payout</span>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-xl font-bold">${metrics?.pendingPayout || '0.00'}</div>
          <p className="text-xs text-muted-foreground">
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
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              Chart coming soon
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
              No recent sales
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
