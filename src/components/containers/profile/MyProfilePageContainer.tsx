'use client';

import Link from 'next/link';
import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, ApiError } from '@/services/apiClient';
import type { Profile } from '@/types/profile';

export function MyProfilePageContainer() {
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

  const initials = profile.displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <Card className="rounded-[28px] bg-surface-container-low">
        <CardContent className="px-6 py-8">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-28 w-28 border-4 border-primary">
              <AvatarImage src={profile.avatarUrl || ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <h1 className="mt-4 font-headline text-4xl font-bold text-on-surface">
              {profile.displayName}
            </h1>
            <p className="text-lg text-on-surface-variant">@{profile.username}</p>
            {profile.bio ? (
              <p className="mt-3 max-w-xl text-on-surface-variant">{profile.bio}</p>
            ) : null}

            <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Posts</p>
                <p className="mt-1 font-headline text-2xl font-bold">{profile.postsCount || 0}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                  Followers
                </p>
                <p className="mt-1 font-headline text-2xl font-bold">{profile.followersCount}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                  Following
                </p>
                <p className="mt-1 font-headline text-2xl font-bold">{profile.followingCount}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link href="/profile/edit">Edit profile</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/settings">Settings</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/wallet">
                  <span className="material-symbols-outlined mr-2 text-[18px]">credit_card</span>
                  Wallet
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/subscriptions">Subscriptions</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
