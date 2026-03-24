'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

interface Subscription {
  id: string;
  planType: string;
  pricePaid: number;
  status: string;
  startedAt: Date | string;
  expiresAt: Date | string;
  autoRenew: boolean;
  creator: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl: string | null;
  };
}

export function SubscriptionsPageContainer() {
  const router = useRouter();
  const { toast } = useToast();

  const [items, setItems] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'paused' | 'expired'>('active');

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.subscriptions.list();
      setItems(result.subscriptions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load subscriptions';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = async (id: string) => {
    try {
      setLoadingId(id);
      await apiClient.subscriptions.cancel(id);
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription will remain active until the end of the period.',
      });
      await load();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[36px] text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/10 py-12 text-center">
        <h3 className="text-lg font-medium">No active subscriptions</h3>
        <p className="mt-2 text-muted-foreground">Subscribe to creators to see them here.</p>
        <Button className="mt-4" asChild>
          <a href="/feed">Explore Creators</a>
        </Button>
      </div>
    );
  }

  const activeItems = items.filter((s) => s.status === 'active');
  const pausedItems = items.filter((s) => s.status === 'paused' || s.status === 'cancelled');
  const expiredItems = items.filter((s) => s.status === 'expired');
  const visibleItems =
    tab === 'active' ? activeItems : tab === 'paused' ? pausedItems : expiredItems;
  const totalSpent = items.reduce((sum, s) => sum + Number(s.pricePaid || 0), 0);
  const monthSpent = activeItems.reduce((sum, s) => sum + Number(s.pricePaid || 0), 0);
  const nextBilling = activeItems[0]?.expiresAt ? formatDate(activeItems[0].expiresAt) : '—';

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="space-y-3">
        <h1 className="font-headline text-3xl font-bold text-on-surface">My Subscriptions</h1>
        <p className="text-sm text-on-surface-variant">
          Manage your active memberships and curated content.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
        <Card className="rounded-2xl bg-surface-container-low">
          <CardContent className="px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Active
            </p>
            <p className="mt-1 font-headline text-4xl font-bold">{activeItems.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-surface-container-low">
          <CardContent className="px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              This month
            </p>
            <p className="mt-1 font-headline text-4xl font-bold text-primary">
              {formatCurrency(monthSpent)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-surface-container-low">
          <CardContent className="px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Total spent
            </p>
            <p className="mt-1 font-headline text-4xl font-bold">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="col-span-3 rounded-2xl bg-surface-container-low md:col-span-1">
          <CardContent className="px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
              Next billing
            </p>
            <p className="mt-1 font-headline text-4xl font-bold">{nextBilling}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'active', label: `Active (${activeItems.length})` },
          { id: 'paused', label: `Paused (${pausedItems.length})` },
          { id: 'expired', label: `Expired (${expiredItems.length})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as 'active' | 'paused' | 'expired')}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold transition',
              tab === item.id
                ? 'bg-primary text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visibleItems.length === 0 ? (
          <Card className="rounded-3xl bg-surface-container-low">
            <CardContent className="py-10 text-center">
              <p className="text-on-surface-variant">No subscriptions in this state.</p>
            </CardContent>
          </Card>
        ) : null}

        {visibleItems.map((sub) => (
          <Card key={sub.id} className="rounded-3xl">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={sub.creator.avatarUrl || ''} />
                  <AvatarFallback>{sub.creator.displayName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{sub.creator.displayName}</CardTitle>
                  <CardDescription className="text-sm">
                    {sub.planType} • {formatCurrency(sub.pricePaid)}/mo
                  </CardDescription>
                </div>
              </div>
              <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                {sub.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2">
                <span className="text-on-surface-variant">Renews</span>
                <span className="font-medium">{formatDate(sub.expiresAt)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2">
                <span className="text-on-surface-variant">Auto-renew</span>
                <span className="font-medium">{sub.autoRenew ? 'On' : 'Off'}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`/messages`}>Message</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`/c/${sub.creator.handle}`}>View</a>
              </Button>
              {sub.status === 'active' && sub.autoRenew ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={loadingId === sub.id}>
                      {loadingId === sub.id && (
                        <span className="material-symbols-outlined mr-2 animate-spin text-[18px]">
                          progress_activity
                        </span>
                      )}
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will lose access after {formatDate(sub.expiresAt)}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleCancel(sub.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Yes, Cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
              {sub.status !== 'active' ? (
                <Button
                  size="sm"
                  className="bg-neutral-700 text-white hover:bg-neutral-800"
                  asChild
                >
                  <a href={`/c/${sub.creator.handle}`}>Renew</a>
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl bg-surface-container-low">
        <CardContent className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-on-surface-variant">Discover new creators and memberships.</p>
          <Button asChild className="h-12 w-full max-w-sm text-base">
            <a href="/explore">Browse creators</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
