'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { OnboardingProgress } from '@/components/creator/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/apiClient';

export function PayoutSetupContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const data = await apiClient.creator.getStatus();
        if (data) {
          setIsConnected(Boolean(data.isSquareConnected));
          if (data.status === 'active') {
            router.push('/creator/dashboard');
          }
        }
      } catch (err) {
        console.error('Failed to check connection:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    void check();
  }, [router]);

  useEffect(() => {
    if (searchParams.get('error')) {
      setError('Failed to connect Square account. Please try again.');
    }
    if (searchParams.get('connected')) {
      setIsConnected(true);
    }
  }, [searchParams]);

  const connectSquare = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.creator.getSquareConnectUrl();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="container mx-auto flex h-[60vh] max-w-2xl items-center justify-center px-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <OnboardingProgress currentStep={8} totalSteps={8} />

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-medium">All Set!</h3>
              <p className="text-muted-foreground">
                Your Square account is connected. Payouts are processed every Friday for balances
                over $20.
              </p>
              <Button onClick={() => router.push('/creator/welcome')}>Complete Setup</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <OnboardingProgress currentStep={7} totalSteps={8} />
      <div className="mt-4 text-center">
        <h1 className="text-3xl font-bold">Set Up Payouts</h1>
        <p className="mt-2 text-muted-foreground">
          Connect your Square account to receive earnings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect Square</CardTitle>
          <CardDescription>
            We use Square to process payments securely. You&apos;ll need a Square seller account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                💳
              </div>
              <div>
                <p className="font-medium">Weekly Payouts</p>
                <p className="text-sm text-muted-foreground">Receive earnings every Friday</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                🔒
              </div>
              <div>
                <p className="font-medium">Secure Transfers</p>
                <p className="text-sm text-muted-foreground">
                  Direct deposits to your bank account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                📊
              </div>
              <div>
                <p className="font-medium">$20 Minimum</p>
                <p className="text-sm text-muted-foreground">
                  Payouts processed when balance exceeds $20
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
          )}

          <Button onClick={connectSquare} className="w-full" disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Square Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
