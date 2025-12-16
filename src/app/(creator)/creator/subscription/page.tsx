'use client';

import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Pricing {
  subscriptionPrice: number;
  subscriptionPrice3m: number | null;
  subscriptionPrice6m: number | null;
  subscriptionPrice12m: number | null;
  freeTrialDays: number;
}

export default function SubscriptionSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<Pricing>({
    subscriptionPrice: 9.99,
    subscriptionPrice3m: null,
    subscriptionPrice6m: null,
    subscriptionPrice12m: null,
    freeTrialDays: 0,
  });

  useEffect(() => {
    void fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await fetch('/api/creator/profile');
      if (response.ok) {
        const data = await response.json();
        setPricing({
          subscriptionPrice: parseFloat(data.subscriptionPrice) || 9.99,
          subscriptionPrice3m: data.subscriptionPrice3m
            ? parseFloat(data.subscriptionPrice3m)
            : null,
          subscriptionPrice6m: data.subscriptionPrice6m
            ? parseFloat(data.subscriptionPrice6m)
            : null,
          subscriptionPrice12m: data.subscriptionPrice12m
            ? parseFloat(data.subscriptionPrice12m)
            : null,
          freeTrialDays: data.freeTrialDays || 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/creator/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricing),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update pricing');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Subscription Settings</h1>
        <p className="text-muted-foreground">Set your subscription pricing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
          <CardDescription>
            Set your monthly subscription price and bundle discounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
            )}
            {success && (
              <div className="rounded-lg bg-green-100 p-4 text-green-800">
                Pricing updated successfully!
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subscriptionPrice">Monthly Price ($)</Label>
              <Input
                id="subscriptionPrice"
                type="number"
                min="4.99"
                max="49.99"
                step="0.01"
                value={pricing.subscriptionPrice}
                onChange={(e) =>
                  setPricing({ ...pricing, subscriptionPrice: parseFloat(e.target.value) })
                }
                required
              />
              <p className="text-sm text-muted-foreground">$4.99 - $49.99</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price3m">3-Month Bundle ($)</Label>
                <Input
                  id="price3m"
                  type="number"
                  step="0.01"
                  placeholder="Auto: 10% off"
                  value={pricing.subscriptionPrice3m ?? ''}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      subscriptionPrice3m: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price6m">6-Month Bundle ($)</Label>
                <Input
                  id="price6m"
                  type="number"
                  step="0.01"
                  placeholder="Auto: 20% off"
                  value={pricing.subscriptionPrice6m ?? ''}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      subscriptionPrice6m: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price12m">12-Month Bundle ($)</Label>
                <Input
                  id="price12m"
                  type="number"
                  step="0.01"
                  placeholder="Auto: 30% off"
                  value={pricing.subscriptionPrice12m ?? ''}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      subscriptionPrice12m: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freeTrialDays">Free Trial (days)</Label>
              <Input
                id="freeTrialDays"
                type="number"
                min="0"
                max="30"
                value={pricing.freeTrialDays}
                onChange={(e) =>
                  setPricing({ ...pricing, freeTrialDays: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-sm text-muted-foreground">
                0-30 days. New subscribers try before they buy.
              </p>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
