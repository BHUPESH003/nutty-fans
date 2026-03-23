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
import { formatCurrency, formatDate } from '@/lib/utils';
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((sub) => (
        <Card key={sub.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={sub.creator.avatarUrl || ''} />
                <AvatarFallback>{sub.creator.displayName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">{sub.creator.displayName}</CardTitle>
                <CardDescription>@{sub.creator.handle}</CardDescription>
              </div>
            </div>
            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>{sub.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-2 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium capitalize">{sub.planType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">{formatCurrency(sub.pricePaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Renews/Expires</span>
              <span className="font-medium">{formatDate(sub.expiresAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-renew</span>
              <span className="font-medium">{sub.autoRenew ? 'On' : 'Off'}</span>
            </div>
          </CardContent>
          <CardFooter>
            {sub.status === 'active' && sub.autoRenew && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    disabled={loadingId === sub.id}
                  >
                    {loadingId === sub.id && (
                      <span className="material-symbols-outlined mr-2 animate-spin text-[18px]">
                        progress_activity
                      </span>
                    )}
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will lose access to exclusive content after {formatDate(sub.expiresAt)}.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleCancel(sub.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {sub.status === 'cancelled' && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={`/c/${sub.creator.handle}`}>Renew</a>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
