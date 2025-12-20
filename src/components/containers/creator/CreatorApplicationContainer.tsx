'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/apiClient';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const CreatorApplicationContainer = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bio: '',
    categoryId: '',
    subscriptionPrice: '9.99',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiClient.common.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const price = parseFloat(formData.subscriptionPrice);
      if (isNaN(price) || price < 4.99 || price > 49.99) {
        setError('Subscription price must be between $4.99 and $49.99');
        setIsSubmitting(false);
        return;
      }

      if (!formData.categoryId) {
        setError('Please select a category');
        setIsSubmitting(false);
        return;
      }

      if (!formData.bio.trim()) {
        setError('Please enter a bio');
        setIsSubmitting(false);
        return;
      }

      const response = await apiClient.creator.apply({
        bio: formData.bio,
        categoryId: formData.categoryId,
        subscriptionPrice: price,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(response.nextStep as any);
    } catch (err: unknown) {
      console.error('Application failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to submit application';
      setError(message);
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
      <Card className="border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Become a Creator</CardTitle>
          <CardDescription>
            Start your journey, monetize your content, and connect with your fans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell your fans about yourself..."
                className="min-h-[120px]"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Write a compelling bio to attract subscribers.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Monthly Subscription Price ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="4.99"
                  max="49.99"
                  className="pl-7"
                  value={formData.subscriptionPrice}
                  onChange={(e) => setFormData({ ...formData, subscriptionPrice: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set a price between $4.99 and $49.99. You can change this later.
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                  Submitting...
                </div>
              ) : (
                'Submit Application'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
