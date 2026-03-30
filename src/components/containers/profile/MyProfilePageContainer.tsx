'use client';

import type { Route } from 'next';
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
    <div className="w-full min-w-0 space-y-5 overflow-x-hidden pb-6 md:space-y-6 md:pb-6">
      <Card className="overflow-hidden rounded-[28px] bg-surface-container-low">
        <CardContent className="px-3 py-5 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border-4 border-primary sm:h-28 sm:w-28">
              <AvatarImage src={profile.avatarUrl || ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <h1 className="mt-4 break-words font-headline text-2xl font-bold text-on-surface sm:text-4xl">
              {profile.displayName}
            </h1>
            <p className="text-sm text-on-surface-variant sm:text-lg">@{profile.username}</p>
            {profile.bio ? (
              <p className="mt-3 max-w-xl text-sm leading-5 text-on-surface-variant sm:text-base sm:leading-6">
                {profile.bio}
              </p>
            ) : null}

            <div className="mt-5 grid w-full grid-cols-3 gap-2 sm:max-w-md sm:grid-cols-3">
              <div className="rounded-2xl bg-background px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  Posts
                </p>
                <p className="mt-1 font-headline text-xl font-bold sm:text-2xl">
                  {profile.postsCount || 0}
                </p>
              </div>
              <div className="rounded-2xl bg-background px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  Followers
                </p>
                <p className="mt-1 font-headline text-xl font-bold sm:text-2xl">
                  {profile.followersCount}
                </p>
              </div>
              <div className="rounded-2xl bg-background px-3 py-2 sm:px-4 sm:py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-on-surface-variant">
                  Following
                </p>
                <p className="mt-1 font-headline text-xl font-bold sm:text-2xl">
                  {profile.followingCount}
                </p>
              </div>
            </div>

            <div className="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              <Button asChild className="h-11 w-full text-sm sm:h-10">
                <Link href={'/account/profile/edit' as Route}>Edit profile</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 w-full text-sm sm:h-10">
                <Link href={'/account/settings' as Route}>Settings</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 w-full text-sm sm:h-10">
                <Link href={'/account/wallet' as Route}>
                  <span className="material-symbols-outlined mr-2 text-[18px]">credit_card</span>
                  Wallet
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 w-full text-sm sm:h-10">
                <Link href={'/account/subscriptions' as Route}>Subscriptions</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
