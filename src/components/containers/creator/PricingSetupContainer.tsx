'use client';

import { AlertCircle, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { OnboardingProgress } from '@/components/creator/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export const PricingSetupContainer = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subscriptionPrice: 9.99,
    freeTrialDays: 0,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.subscriptionPrice < 4.99 || formData.subscriptionPrice > 49.99) {
      setError('Subscription price must be between $4.99 and $49.99');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/creator/apply/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit pricing');
      }

      // After pricing, submit for review
      const reviewResponse = await fetch('/api/creator/apply/submit-review', {
        method: 'POST',
      });

      const reviewData = await reviewResponse.json();

      if (!reviewResponse.ok) {
        throw new Error(reviewData.error?.message || 'Failed to submit for review');
      }

      router.push(reviewData.data.nextStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedEarnings = (subscribers: number) => {
    const gross = subscribers * formData.subscriptionPrice;
    const net = gross * 0.8; // 80% payout
    return net.toFixed(2);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <OnboardingProgress currentStep={4} totalSteps={8} />

      <Card className="mt-8 border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Set Your Pricing</CardTitle>
          <CardDescription>
            Choose your monthly subscription price. You can change this anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Subscription Price */}
            <div className="space-y-4">
              <Label htmlFor="price">Monthly Subscription Price</Label>
              <div className="text-center">
                <div className="mb-4 text-5xl font-bold">
                  ${formData.subscriptionPrice.toFixed(2)}
                </div>
                <Slider
                  value={[formData.subscriptionPrice]}
                  onValueChange={(value: number[]) =>
                    setFormData({ ...formData, subscriptionPrice: value[0] ?? 9.99 })
                  }
                  min={4.99}
                  max={49.99}
                  step={0.5}
                  className="w-full"
                />
                <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                  <span>$4.99</span>
                  <span>$49.99</span>
                </div>
              </div>
            </div>

            {/* Free Trial */}
            <div className="space-y-4">
              <Label htmlFor="trial">Free Trial Days (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="trial"
                  type="number"
                  min={0}
                  max={7}
                  value={formData.freeTrialDays}
                  onChange={(e) =>
                    setFormData({ ...formData, freeTrialDays: parseInt(e.target.value) || 0 })
                  }
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days (0-7)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Free trials can help attract new subscribers.
              </p>
            </div>

            {/* Earnings Calculator */}
            <Card className="border-dashed bg-primary/5">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  Estimated Monthly Earnings
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">${estimatedEarnings(10)}</p>
                    <p className="text-xs text-muted-foreground">10 subscribers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${estimatedEarnings(100)}</p>
                    <p className="text-xs text-muted-foreground">100 subscribers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${estimatedEarnings(1000)}</p>
                    <p className="text-xs text-muted-foreground">1,000 subscribers</p>
                  </div>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Based on 80% payout rate (industry-leading!)
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/creator/apply/profile')}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Submitting...
                  </div>
                ) : (
                  'Submit for Review'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
