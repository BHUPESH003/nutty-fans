'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

import { OnboardingProgress } from '@/components/creator/OnboardingProgress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const ProfileSetupContainer = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    avatarUrl: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      tiktok: '',
    },
  });

  // Fetch existing user data and creator profile to prefill form
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session and creator status in parallel
        const [sessionResponse, statusResponse] = await Promise.all([
          fetch('/api/auth/session'),
          fetch('/api/creator/status'),
        ]);

        // Pre-fill from session (user data)
        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          if (session?.user) {
            setFormData((prev) => ({
              ...prev,
              displayName: session.user.displayName || session.user.name || '',
              username: session.user.username || '',
              avatarUrl: session.user.avatarUrl || session.user.image || '',
            }));
          }
        }

        // Pre-fill from creator status (bio, socialLinks)
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const profile = statusData.data?.profile;
          if (profile) {
            setFormData((prev) => ({
              ...prev,
              displayName: profile.displayName || prev.displayName,
              username: profile.username || prev.username,
              avatarUrl: profile.avatarUrl || prev.avatarUrl,
              bio: profile.bio || '',
              socialLinks: profile.socialLinks || prev.socialLinks,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  const validateUsername = (username: string) => {
    if (username.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (username.length > 30) {
      return 'Username must be less than 30 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setFormData({ ...formData, username: value });
    setUsernameError(validateUsername(value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    const usernameErr = validateUsername(formData.username);
    if (usernameErr) {
      setUsernameError(usernameErr);
      return;
    }

    if (formData.bio.length < 20) {
      setError('Bio must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty social links
      const socialLinks: Record<string, string> = {};
      if (formData.socialLinks.instagram) socialLinks['instagram'] = formData.socialLinks.instagram;
      if (formData.socialLinks.twitter) socialLinks['twitter'] = formData.socialLinks.twitter;
      if (formData.socialLinks.tiktok) socialLinks['tiktok'] = formData.socialLinks.tiktok;

      const response = await fetch('/api/creator/apply/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.displayName,
          username: formData.username,
          bio: formData.bio,
          avatarUrl: formData.avatarUrl || undefined,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle various error response formats
        const errorMessage = data.message || data.error?.message || 'Failed to submit profile';
        throw new Error(errorMessage);
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
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <OnboardingProgress currentStep={3} totalSteps={8} />
        <div className="mt-8 flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <OnboardingProgress currentStep={3} totalSteps={8} />

      <Card className="mt-8 border-none bg-card/50 shadow-xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
          <CardDescription>
            Create your creator identity. This is what fans will see.
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

            {/* Avatar Placeholder */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-2xl">
                  {formData.displayName?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Profile Photo</p>
                <p className="text-sm text-muted-foreground">
                  You can upload a photo after completing setup.
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                placeholder="Your public name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear to fans.
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                <Input
                  id="username"
                  placeholder="username"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  className="pl-8"
                  maxLength={30}
                />
              </div>
              {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
              <p className="text-xs text-muted-foreground">
                Your unique handle. Only letters, numbers, and underscores.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Tell your fans about yourself and what content you create..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="min-h-[120px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 characters (minimum 20)
              </p>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <Label>Social Links (Optional)</Label>
              <div className="grid gap-3">
                <Input
                  placeholder="Instagram username"
                  value={formData.socialLinks.instagram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="Twitter/X username"
                  value={formData.socialLinks.twitter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                    })
                  }
                />
                <Input
                  placeholder="TikTok username"
                  value={formData.socialLinks.tiktok}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, tiktok: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/creator/apply/category')}
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
