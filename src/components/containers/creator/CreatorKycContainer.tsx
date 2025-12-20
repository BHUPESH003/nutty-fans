'use client';

import { AlertCircle, CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/apiClient';

export const CreatorKycContainer = () => {
  const router = useRouter();
  // const [status, setStatus] = useState<string | null>(null); // Unused
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiClient.creator.getStatus();
        if (data) {
          // setStatus(data.status);
          setKycStatus(data.kycStatus);

          if (data.status === 'active' || data.status === 'pending_payout_setup') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.push((data.nextStep || '/creator/dashboard') as any);
          }
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
        setError('Failed to load status.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatus();
  }, [router]);

  const handleStartVerification = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const { sessionUrl } = await apiClient.creator.startKyc();
      // In a real app, we would redirect to the sessionUrl (e.g. Stripe Identity)
      // For this demo/mock, we might just reload or show a success message
      // Assuming the backend mock updates status immediately or provides a URL to visit
      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        // Fallback for mock if no URL
        window.location.reload();
      }
    } catch (err: unknown) {
      console.error('Failed to start verification:', err);
      const message = err instanceof Error ? err.message : 'Failed to start verification';
      setError(message);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Identity Verification</CardTitle>
          <CardDescription>
            To ensure safety and compliance, we need to verify your identity before you can start
            earning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-lg border bg-background/50 p-6 text-center">
            {kycStatus === 'pending' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-5 w-5" />
                  <span>Verification Required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please prepare your government-issued ID and be ready to take a selfie.
                </p>
                <Button onClick={handleStartVerification} disabled={isStarting} size="lg">
                  {isStarting ? 'Starting...' : 'Start Verification'}
                </Button>
              </div>
            )}

            {kycStatus === 'submitted' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-yellow-500">
                  <Clock className="h-6 w-6" />
                  <span className="text-lg font-medium">Verification in Progress</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We are reviewing your documents. This usually takes a few minutes but can take up
                  to 24 hours.
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Check Status
                </Button>
              </div>
            )}

            {kycStatus === 'approved' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-500">
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-lg font-medium">Verified Successfully</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your identity has been verified. You can now proceed to setup payouts.
                </p>
                <Button onClick={() => router.push('/creator/payouts/setup')}>Setup Payouts</Button>
              </div>
            )}

            {kycStatus === 'rejected' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-destructive">
                  <XCircle className="h-6 w-6" />
                  <span className="text-lg font-medium">Verification Failed</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We could not verify your identity. Please try again or contact support.
                </p>
                <Button
                  onClick={handleStartVerification}
                  disabled={isStarting}
                  variant="destructive"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
