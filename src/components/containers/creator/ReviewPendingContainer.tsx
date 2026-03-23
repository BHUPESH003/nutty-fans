'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { OnboardingProgress } from '@/components/creator/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/services/apiClient';

export const ReviewPendingContainer = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await apiClient.creator.getStatus();
        if (data) {
          const currentStatus = (data as any).onboardingStatus || (data as any).status; // eslint-disable-line @typescript-eslint/no-explicit-any

          // If already approved, redirect to next step
          if (
            currentStatus === 'review_approved' ||
            currentStatus === 'kyc_pending' ||
            currentStatus === 'kyc_in_progress' ||
            currentStatus === 'active'
          ) {
            router.push((data as any).nextStep); // eslint-disable-line @typescript-eslint/no-explicit-any
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
        <span className="material-symbols-outlined animate-spin text-[36px] text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <OnboardingProgress currentStep={5} totalSteps={8} />

      <Card className="mt-8 border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
            <span className="material-symbols-outlined text-4xl text-amber-500">schedule</span>
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
                <span className="material-symbols-outlined text-[22px] text-green-600">
                  check_circle
                </span>
                <span>Eligibility verified</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-green-600">
                  check_circle
                </span>
                <span>Category selected</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-green-600">
                  check_circle
                </span>
                <span>Profile created</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px] text-green-600">
                  check_circle
                </span>
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
