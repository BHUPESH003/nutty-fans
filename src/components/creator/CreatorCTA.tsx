'use client';

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
            <span className="material-symbols-outlined mr-2 text-[18px]">palette</span>
            Creator Dashboard
          </Link>
        </Button>
      );
    }

    return (
      <div className={cn('rounded-2xl border border-primary/15 bg-primary/5 p-4', className)}>
        <div className="mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
          <h3 className="font-headline text-sm font-semibold text-on-surface">Creator Mode</h3>
        </div>
        <p className="mb-3 text-xs text-on-surface-variant">Manage your content and earnings.</p>
        <Button size="sm" className="w-full text-xs" asChild>
          <Link href="/creator/dashboard">
            Open Dashboard
            <span className="material-symbols-outlined ml-2 text-[14px]">arrow_forward</span>
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
            <span className="material-symbols-outlined mr-2 text-[18px] text-amber-600">
              warning
            </span>
            Continue Setup
          </Link>
        </Button>
      );
    }

    return (
      <div className={cn('rounded-2xl border border-amber-200 bg-amber-50/80 p-4', className)}>
        <div className="mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
          <h3 className="font-headline text-sm font-semibold text-on-surface">Setup Incomplete</h3>
        </div>
        <p className="mb-1 text-xs text-on-surface-variant">
          {getProgressLabel()} - Continue where you left off.
        </p>
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: getProgressPercent(onboardingStatus as OnboardingStatus) }}
          />
        </div>
        <Button size="sm" className="w-full text-xs" variant="secondary" asChild>
          <Link href={targetUrl as Route}>
            Continue Setup
            <span className="material-symbols-outlined ml-2 text-[14px]">arrow_forward</span>
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
        'rounded-2xl border border-surface-container-high bg-surface-container-low p-4',
        className
      )}
    >
      <h3 className="mb-1 font-headline text-sm font-semibold text-on-surface">Become a Creator</h3>
      <p className="mb-3 text-xs text-on-surface-variant">Start earning from your content today.</p>
      <Button size="sm" className="w-full text-xs" variant="default" asChild>
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
