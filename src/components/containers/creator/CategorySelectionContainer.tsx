'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { OnboardingProgress } from '@/components/creator/OnboardingProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/services/apiClient';

const CREATOR_GOALS = [
  {
    value: 'full_time',
    label: 'Full-time income',
    description: 'I want this to be my main source of income',
  },
  { value: 'side_hustle', label: 'Side hustle', description: 'Extra income alongside my main job' },
  {
    value: 'hobby',
    label: 'Hobby/Passion project',
    description: 'Just for fun and sharing my passion',
  },
];

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const CategorySelectionContainer = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    creatorGoal: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and saved data in parallel
        const [categoriesData, statusResponse] = await Promise.all([
          apiClient.common.getCategories(),
          fetch('/api/creator/status'),
        ]);

        setCategories(categoriesData);

        // Pre-populate form with saved data
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const profile = statusData.data?.profile;
          if (profile) {
            setFormData((prev) => ({
              ...prev,
              categoryId: profile.categoryId || '',
              creatorGoal: profile.creatorGoal || '',
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }

    if (!formData.creatorGoal) {
      setError('Please select your creator goal');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/creator/apply/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit category');
      }

      router.push(data.data.nextStep);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
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
      <OnboardingProgress currentStep={2} totalSteps={8} />

      <Card className="mt-8 border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Choose Your Category</CardTitle>
          <CardDescription>Select the category that best describes your content.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Primary Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This helps fans discover your content.
              </p>
            </div>

            {/* Creator Goal */}
            <div className="space-y-3">
              <Label>What&apos;s your goal as a creator?</Label>
              <div className="grid gap-3">
                {CREATOR_GOALS.map((goal) => (
                  <label
                    key={goal.value}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      formData.creatorGoal === goal.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="creatorGoal"
                        value={goal.value}
                        checked={formData.creatorGoal === goal.value}
                        onChange={(e) => setFormData({ ...formData, creatorGoal: e.target.value })}
                        className="sr-only"
                      />
                      <div
                        className={`h-4 w-4 rounded-full border-2 ${
                          formData.creatorGoal === goal.value
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {formData.creatorGoal === goal.value && (
                          <div className="m-0.5 h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{goal.label}</p>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/creator/apply/eligibility')}
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </div>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
