'use client';

import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const COMMISSION_TIERS = [
  { subscribers: '0-100', fee: '4%', highlight: true },
  { subscribers: '101-200', fee: '6%', highlight: false },
  { subscribers: '201-400', fee: '8%', highlight: false },
  { subscribers: '401-600', fee: '10%', highlight: false },
  { subscribers: '601-800', fee: '12%', highlight: false },
  { subscribers: '801-1,000', fee: '14%', highlight: false },
  { subscribers: '1,000+', fee: '16%', highlight: false },
];

export const CreatorStartContainer = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [showCommissionDetails, setShowCommissionDetails] = useState(false);

  // Check if user already has a creator profile
  useEffect(() => {
    const checkCreatorStatus = async () => {
      try {
        const response = await fetch('/api/creator/status');
        if (response.ok) {
          const data = await response.json();
          // If user has any onboarding status beyond not_started, redirect them appropriately
          if (data.data?.onboardingStatus && data.data.onboardingStatus !== 'not_started') {
            router.push(data.data.nextStep || '/creator/dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('Failed to check creator status:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    void checkCreatorStatus();
  }, [router]);

  const handleStart = () => {
    setIsLoading(true);
    router.push('/creator/apply/eligibility');
  };

  if (isCheckingStatus) {
    return (
      <div className="container mx-auto flex h-[60vh] max-w-3xl items-center justify-center px-4 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-4xl font-bold text-transparent">
          Become a Creator
        </h1>
        <p className="text-lg text-muted-foreground">
          Share your content, build your audience, and earn on your own terms.
        </p>
      </div>

      {/* Benefits */}
      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <Card className="border-none bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold">Earn Your Way</h3>
              <p className="text-sm text-muted-foreground">
                Set your own subscription price between $4.99 - $49.99/month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Fees That Grow With You</h3>
              <p className="text-sm text-muted-foreground">
                Start at just 4% — one of the lowest in the industry
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold">Safe & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Your content is protected with enterprise-grade security
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-card/50 backdrop-blur-sm">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold">Quick Setup</h3>
              <p className="text-sm text-muted-foreground">
                Complete verification and start posting in under 10 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Model - Collapsible */}
      <Card className="mb-8 border-none bg-gradient-to-br from-primary/5 to-purple-500/5 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowCommissionDetails(!showCommissionDetails)}
            className="flex w-full items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Transparent Fee Structure</CardTitle>
                <CardDescription className="mt-1">
                  Start at 4% • Max 16% at 1,000+ subs
                </CardDescription>
              </div>
            </div>
            {showCommissionDetails ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </CardHeader>

        {showCommissionDetails && (
          <CardContent className="pt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              We believe new creators shouldn&apos;t be burdened with high fees. As your community
              grows, we grow together — your success funds better tools for everyone.
            </p>

            {/* Commission Tiers Table */}
            <div className="overflow-hidden rounded-lg border border-border/50">
              <div className="grid grid-cols-2 bg-muted/30 px-4 py-2 text-sm font-medium">
                <span>Subscribers</span>
                <span className="text-right">Platform Fee</span>
              </div>
              {COMMISSION_TIERS.map((tier, index) => (
                <div
                  key={tier.subscribers}
                  className={`grid grid-cols-2 px-4 py-2.5 text-sm ${
                    tier.highlight
                      ? 'bg-green-500/10 font-medium text-green-600 dark:text-green-400'
                      : index % 2 === 0
                        ? 'bg-background/50'
                        : ''
                  }`}
                >
                  <span>{tier.subscribers}</span>
                  <span className="text-right">{tier.fee}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p>• Your fee tier is based on your active subscriber count.</p>
              <p>• All earnings (subscriptions, tips, messages, live streams) use the same rate.</p>
              <p>
                • When you reach a new tier, your rate updates immediately for all transactions.
              </p>
              <p>• No retroactive charges — previous earnings stay at their original rate.</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Requirements */}
      <Card className="mb-8 border-none bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">What You&apos;ll Need</CardTitle>
          <CardDescription>Make sure you have these ready before starting</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Be 18 years or older</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                Valid government-issued ID (passport, driver&apos;s license, or national ID)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Bank account or debit card for payouts</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>A profile photo for your creator page</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <Button size="lg" className="gap-2 px-8" onClick={handleStart} disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </>
          ) : (
            <>
              Start Application
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">Takes about 5-10 minutes to complete</p>
      </div>
    </div>
  );
};
