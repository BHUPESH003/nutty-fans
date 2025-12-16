'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

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

export function SubscriptionListClient({
  initialSubscriptions,
}: {
  initialSubscriptions: Subscription[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    try {
      setLoadingId(id);
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription will remain active until the end of the period.',
      });

      router.refresh();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription.',
        // variant: 'destructive',
      });
    } finally {
      setLoadingId(null);
    }
  };

  if (initialSubscriptions.length === 0) {
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
      {initialSubscriptions.map((sub) => (
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
                    {loadingId === sub.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
