'use client';

import { AlertTriangle, ArrowRight, Sparkles, Palette } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useCreatorStatus } from '@/hooks/useCreatorStatus';
import { cn } from '@/lib/utils';

type OnboardingStatus =
  | 'not_started'
  | 'eligibility'
  | 'category_selection'
  | 'profile_setup'
  | 'pricing_setup'
  | 'review_pending'
  | 'kyc_required'
  | 'kyc_in_progress'
  | 'payout_setup'
  | 'active';

interface CreatorCTAProps {
  variant?: 'sidebar' | 'inline' | 'compact';
  className?: string;
}

// Get the correct URL based on onboarding status
function getOnboardingUrl(status: OnboardingStatus): string {
  const routes: Record<OnboardingStatus, string> = {
    not_started: '/creator/start',
    eligibility: '/creator/onboard/eligibility',
    category_selection: '/creator/onboard/category',
    profile_setup: '/creator/onboard/profile',
    pricing_setup: '/creator/onboard/pricing',
    review_pending: '/creator/onboard/review',
    kyc_required: '/creator/verify',
    kyc_in_progress: '/creator/verify',
    payout_setup: '/creator/payouts/setup',
    active: '/creator/dashboard',
  };
  return routes[status] || '/creator/start';
}

export function CreatorCTA({ variant = 'sidebar', className }: CreatorCTAProps) {
  const { onboardingStatus, isLoading } = useCreatorStatus();

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  const isActive = onboardingStatus === 'active';
  const isInProgress = onboardingStatus !== 'not_started' && onboardingStatus !== 'active';
  const targetUrl = getOnboardingUrl(onboardingStatus as OnboardingStatus);

  // If creator is active, show Creator Dashboard link
  if (isActive) {
    if (variant === 'compact') {
      return (
        <Button variant="default" className={cn('rounded-full', className)} asChild>
          <Link href="/creator/dashboard">
            <Palette className="mr-2 h-4 w-4" />
            Creator Dashboard
          </Link>
        </Button>
      );
    }

    return (
      <div
        className={cn(
          'rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-purple-900/20 p-4',
          className
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-white">Creator Mode</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">Manage your content and earnings.</p>
        <Button size="sm" className="w-full text-xs" asChild>
          <Link href="/creator/dashboard">
            Open Dashboard
            <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </div>
    );
  }

  // If in progress, show warning and direct link to current step
  if (isInProgress) {
    const getProgressLabel = () => {
      switch (onboardingStatus) {
        case 'eligibility':
          return 'Eligibility check';
        case 'category_selection':
          return 'Category selection';
        case 'profile_setup':
          return 'Profile setup';
        case 'pricing_setup':
          return 'Pricing setup';
        case 'review_pending':
          return 'Review pending';
        case 'kyc_required':
          return 'KYC required';
        case 'kyc_in_progress':
          return 'KYC in progress';
        case 'payout_setup':
          return 'Payout setup';
        default:
          return 'Setup in progress';
      }
    };

    if (variant === 'compact') {
      return (
        <Button variant="secondary" className={cn('relative rounded-full', className)} asChild>
          <Link href={targetUrl as Route}>
            <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
            Continue Setup
          </Link>
        </Button>
      );
    }

    return (
      <div
        className={cn(
          'rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-orange-900/10 p-4',
          className
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-semibold text-white">Setup Incomplete</h3>
        </div>
        <p className="mb-1 text-xs text-muted-foreground">
          {getProgressLabel()} - Continue where you left off.
        </p>
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-yellow-500 transition-all"
            style={{ width: getProgressPercent(onboardingStatus as OnboardingStatus) }}
          />
        </div>
        <Button size="sm" className="w-full text-xs" variant="secondary" asChild>
          <Link href={targetUrl as Route}>
            Continue Setup
            <ArrowRight className="ml-2 h-3 w-3" />
          </Link>
        </Button>
      </div>
    );
  }

  // Default: Not started - show "Become a Creator"
  if (variant === 'compact') {
    return (
      <Button variant="secondary" className={cn('rounded-full', className)} asChild>
        <Link href="/creator/start">Become a Creator</Link>
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/5 bg-gradient-to-br from-purple-900/20 to-primary/10 p-4',
        className
      )}
    >
      <h3 className="mb-1 text-sm font-semibold text-white">Become a Creator</h3>
      <p className="mb-3 text-xs text-muted-foreground">Start earning from your content today.</p>
      <Button size="sm" className="w-full text-xs" variant="secondary" asChild>
        <Link href="/creator/start">Apply Now</Link>
      </Button>
    </div>
  );
}

function getProgressPercent(status: OnboardingStatus): string {
  const stages: Record<OnboardingStatus, number> = {
    not_started: 0,
    eligibility: 14,
    category_selection: 28,
    profile_setup: 42,
    pricing_setup: 56,
    review_pending: 70,
    kyc_required: 75,
    kyc_in_progress: 80,
    payout_setup: 90,
    active: 100,
  };
  return `${stages[status] || 0}%`;
}
