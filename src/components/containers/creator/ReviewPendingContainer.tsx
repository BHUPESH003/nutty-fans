'use client';

import { Clock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { OnboardingProgress } from '@/components/creator/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const ReviewPendingContainer = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/creator/status');
        const data = await response.json();

        if (data.data) {
          const currentStatus = data.data.onboardingStatus || data.data.status;

          // If already approved, redirect to next step
          if (
            currentStatus === 'review_approved' ||
            currentStatus === 'kyc_pending' ||
            currentStatus === 'kyc_in_progress' ||
            currentStatus === 'active'
          ) {
            router.push(data.data.nextStep);
          }

          // If rejected, redirect to rejected page
          if (currentStatus === 'review_rejected') {
            router.push('/creator/apply/rejected');
          }
        }
      } catch (err) {
        console.error('Failed to check status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void checkStatus();

    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <OnboardingProgress currentStep={5} totalSteps={8} />

      <Card className="mt-8 border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Application Under Review</CardTitle>
          <CardDescription>
            We&apos;re reviewing your profile. This usually takes just a few moments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-background/50 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Eligibility verified</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Category selected</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Profile created</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Pricing configured</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-muted-foreground">Reviewing profile...</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            This page will automatically update when your review is complete.
          </p>

          <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
            Refresh Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
