'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function CreatorApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    categoryId: '',
    subscriptionPrice: '9.99',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/creator/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subscriptionPrice: parseFloat(formData.subscriptionPrice),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit application');
      }

      router.push(data.nextStep || '/creator/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Become a Creator</h1>
        <p className="mt-2 text-muted-foreground">
          Start monetizing your content and connect with your fans
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creator Application</CardTitle>
          <CardDescription>
            Fill out the form below to apply. You&apos;ll need to verify your identity after
            submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Your creator name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell your fans about yourself..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionPrice">Monthly Subscription Price ($)</Label>
              <Input
                id="subscriptionPrice"
                type="number"
                min="4.99"
                max="49.99"
                step="0.01"
                value={formData.subscriptionPrice}
                onChange={(e) => setFormData({ ...formData, subscriptionPrice: e.target.value })}
                required
              />
              <p className="text-sm text-muted-foreground">
                Set your price between $4.99 and $49.99 per month
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Continue to Verification'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>By applying, you agree to our Creator Terms of Service</p>
      </div>
    </div>
  );
}
