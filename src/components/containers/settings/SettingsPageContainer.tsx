'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { apiClient, ApiError } from '@/services/apiClient';
import type { Profile } from '@/types/profile';
import type { SettingsResponse } from '@/types/settings';

export function SettingsPageContainer() {
  const [settings, setSettings] = React.useState<SettingsResponse | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingField, setSavingField] = React.useState<string | null>(null);
  const push = usePushNotifications();

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [data, me] = await Promise.all([apiClient.settings.get(), apiClient.profile.me()]);
        if (cancelled) return;
        setSettings(data);
        setProfile(me);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setError('You need to sign in to view your settings.');
        } else {
          setError('Unable to load settings. Please try again.');
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

  const handleToggle =
    <S extends 'notifications' | 'privacy'>(section: S, field: keyof SettingsResponse[S]) =>
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!settings) return;

      const nextValue = event.target.checked;
      const key = `${section}.${String(field)}`;
      setSavingField(key);

      const previousSection = settings[section];
      const previousValue = previousSection[field] as boolean;

      setSettings({
        ...settings,
        [section]: {
          ...settings[section],
          [field]: nextValue,
        },
      });

      try {
        const updated = await apiClient.settings.update({
          [section]: {
            [field]: nextValue,
          },
        });
        setSettings(updated);
      } catch {
        setSettings({
          ...settings,
          [section]: {
            ...previousSection,
            [field]: previousValue,
          },
        });
      } finally {
        setSavingField(null);
      }
    };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
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

  if (!settings) {
    return null;
  }

  const mobileNotificationOffCount =
    Number(!settings.notifications.emailNotifications) +
    Number(!settings.notifications.platformUpdates) +
    Number(!settings.notifications.pushNotifications);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Mobile-first overview */}
      <section className="rounded-[24px] bg-surface-container-low p-5 md:hidden">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile?.avatarUrl || ''}
              alt=""
              className="h-24 w-24 rounded-full border-4 border-primary object-cover"
            />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-white">
              <span className="material-symbols-outlined text-[16px]">verified</span>
            </span>
          </div>
          <h2 className="mt-4 font-headline text-3xl font-bold text-on-surface">
            {profile?.displayName || 'User'}
          </h2>
          <p className="text-base text-on-surface-variant">@{profile?.username || 'user'}</p>
          <Link href="/profile/edit" className="mt-1 text-lg font-semibold text-primary">
            Edit profile
          </Link>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
              Account essentials
            </p>
            <div className="space-y-1 rounded-3xl bg-surface-container p-2">
              <Link
                href="/profile/edit"
                className="flex items-center justify-between rounded-2xl p-3"
              >
                <span className="flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                  Account
                </span>
                <span className="material-symbols-outlined text-on-surface-variant">
                  chevron_right
                </span>
              </Link>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl p-3 text-left"
              >
                <span className="flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    notifications
                  </span>
                  Notifications
                </span>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                  {mobileNotificationOffCount} off
                </span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl p-3 text-left"
              >
                <span className="flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined text-on-surface-variant">shield</span>
                  Security
                </span>
                <span className="material-symbols-outlined text-amber-500">warning</span>
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
              Earnings & payments
            </p>
            <div className="space-y-1 rounded-3xl bg-surface-container p-2">
              <Link
                href="/transactions"
                className="flex items-center justify-between rounded-2xl p-3"
              >
                <span className="flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    payments
                  </span>
                  Payouts
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Active
                </span>
              </Link>
              <Link href="/wallet" className="flex items-center justify-between rounded-2xl p-3">
                <span className="flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    credit_card
                  </span>
                  Payments
                </span>
                <span className="text-sm text-on-surface-variant">Wallet</span>
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
              Privacy & safety
            </p>
            <div className="space-y-1 rounded-3xl bg-surface-container p-2">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl p-3 text-left text-amber-700"
              >
                <span className="flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined">block</span>Deactivate account
                </span>
                <span className="material-symbols-outlined text-on-surface-variant">
                  chevron_right
                </span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl p-3 text-left text-destructive"
                disabled
              >
                <span className="flex items-center gap-3 text-lg">
                  <span className="material-symbols-outlined">delete</span>Delete account
                </span>
                <span className="material-symbols-outlined text-on-surface-variant">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop detail panels */}
      <section className="hidden grid-cols-[280px_minmax(0,1fr)] gap-6 md:grid">
        <aside className="rounded-[24px] bg-surface-container-low p-5">
          <h2 className="font-headline text-3xl font-bold text-on-surface">Settings</h2>
          <div className="mt-6 space-y-5 text-[15px]">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Account
              </p>
              <div className="space-y-1">
                <Link
                  href="/profile/edit"
                  className="block rounded-xl bg-primary/10 px-3 py-2 font-semibold text-primary"
                >
                  Profile
                </Link>
                <p className="rounded-xl px-3 py-2 text-on-surface-variant">Security</p>
                <p className="rounded-xl px-3 py-2 text-on-surface-variant">Privacy</p>
                <p className="rounded-xl px-3 py-2 text-on-surface-variant">Notifications</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                Billing
              </p>
              <div className="space-y-1">
                <Link
                  href="/wallet"
                  className="block rounded-xl px-3 py-2 text-on-surface-variant hover:bg-surface-container"
                >
                  Wallet
                </Link>
                <Link
                  href="/subscriptions"
                  className="block rounded-xl px-3 py-2 text-on-surface-variant hover:bg-surface-container"
                >
                  Subscriptions
                </Link>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-8 w-full"
            onClick={() => {
              void signOut();
            }}
          >
            Log Out
          </Button>
        </aside>

        <div className="space-y-6">
          <Card className="rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Account</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={settings.email} disabled />
              </div>
              <div className="space-y-1">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input id="legalName" value={settings.legalName || 'Not set'} disabled />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['emailNotifications', 'Email notifications'],
                ['marketingEmails', 'Marketing emails'],
                ['platformUpdates', 'Platform updates'],
                ['pushNotifications', 'Web push notifications'],
              ].map(([field, label]) => (
                <div
                  key={field}
                  className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3"
                >
                  <p className="text-sm font-medium">{label}</p>
                  <Switch
                    checked={
                      settings.notifications[field as keyof SettingsResponse['notifications']]
                    }
                    onCheckedChange={(checked) =>
                      handleToggle(
                        'notifications',
                        field as keyof SettingsResponse['notifications']
                      )({
                        target: { checked },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    disabled={savingField === `notifications.${field}`}
                  />
                </div>
              ))}
              <p className="text-xs text-on-surface-variant">
                Push status:{' '}
                {push.isSupported
                  ? push.isSubscribed
                    ? 'Subscribed'
                    : 'Not subscribed'
                  : 'Not supported'}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[24px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
                <p className="text-sm font-medium">Profile discoverability</p>
                <Switch
                  checked={settings.privacy.profileDiscoverable}
                  onCheckedChange={(checked) =>
                    handleToggle(
                      'privacy',
                      'profileDiscoverable'
                    )({
                      target: { checked },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  disabled={savingField === 'privacy.profileDiscoverable'}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
                <p className="text-sm font-medium">Show location</p>
                <Switch
                  checked={settings.privacy.showLocation}
                  onCheckedChange={(checked) =>
                    handleToggle(
                      'privacy',
                      'showLocation'
                    )({
                      target: { checked },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  disabled={savingField === 'privacy.showLocation'}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
