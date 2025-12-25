'use client';

import { useSearchParams } from 'next/navigation';
import * as React from 'react';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, ApiError } from '@/services/apiClient';
import type { Profile } from '@/types/profile';

export function MyProfilePageContainer() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiClient.profile.me();
        if (cancelled) return;
        setProfile(data);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setError('You need to sign in to view your profile.');
        } else {
          setError('Unable to load your profile. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="size-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-[hsl(var(--accent-error))]">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <ProfileHeader
        profile={profile}
        isSelf
        stats={{
          followers: profile.followersCount,
          following: profile.followingCount,
          posts: profile.postsCount || 0,
        }}
      />
      <ProfileTabs defaultValue={tabParam || 'wallet'} />
    </div>
  );
}
