'use client';

import { signOut } from 'next-auth/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { apiClient, ApiError } from '@/services/apiClient';
import type { SettingsResponse } from '@/types/settings';

export function SettingsPageContainer() {
  const [settings, setSettings] = React.useState<SettingsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingField, setSavingField] = React.useState<string | null>(null);
  const push = usePushNotifications();

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiClient.settings.get();
        if (cancelled) return;
        setSettings(data);
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
        <Skeleton className="h-20 w-full" />
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={settings.email} disabled />
            <p className="text-xs text-muted-foreground">Contact support to change email.</p>
          </div>
          {settings.legalName ? (
            <div className="space-y-1">
              <Label htmlFor="legalName">Legal Name</Label>
              <Input id="legalName" value={settings.legalName} disabled />
              <p className="text-xs text-muted-foreground">From identity verification.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>
              <span className="block">Email Notifications</span>
              <span className="text-xs text-muted-foreground">
                Receive important updates via email.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.notifications.emailNotifications}
              onChange={handleToggle('notifications', 'emailNotifications')}
              disabled={savingField === 'notifications.emailNotifications'}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>
              <span className="block">Marketing Emails</span>
              <span className="text-xs text-muted-foreground">
                News, features, and promotional content.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.notifications.marketingEmails}
              onChange={handleToggle('notifications', 'marketingEmails')}
              disabled={savingField === 'notifications.marketingEmails'}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>
              <span className="block">Platform Updates</span>
              <span className="text-xs text-muted-foreground">
                Product announcements and policy changes.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.notifications.platformUpdates}
              onChange={handleToggle('notifications', 'platformUpdates')}
              disabled={savingField === 'notifications.platformUpdates'}
            />
          </label>

          <div className="rounded-lg border border-white/10 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Web Push Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Browser notifications (web only). Requires permission and a supported browser.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.pushNotifications}
                onChange={handleToggle('notifications', 'pushNotifications')}
                disabled={savingField === 'notifications.pushNotifications'}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {push.isSupported
                  ? push.isSubscribed
                    ? 'Status: subscribed'
                    : 'Status: not subscribed'
                  : 'Not supported'}
              </div>
              {settings.notifications.pushNotifications && push.isSupported ? (
                push.isSubscribed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void push.unsubscribe();
                    }}
                  >
                    Unsubscribe
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      void push.subscribe();
                    }}
                  >
                    Subscribe
                  </Button>
                )
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>
              <span className="block">Profile Discoverability</span>
              <span className="text-xs text-muted-foreground">
                Allow others to find your profile in search.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.privacy.profileDiscoverable}
              onChange={handleToggle('privacy', 'profileDiscoverable')}
              disabled={savingField === 'privacy.profileDiscoverable'}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>
              <span className="block">Show Location</span>
              <span className="text-xs text-muted-foreground">
                Display location on your public profile.
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.privacy.showLocation}
              onChange={handleToggle('privacy', 'showLocation')}
              disabled={savingField === 'privacy.showLocation'}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h4">Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void signOut();
            }}
          >
            Log Out
          </Button>
          <button
            type="button"
            className="text-sm text-[hsl(var(--accent-error))] underline"
            disabled
          >
            Delete Account (coming soon)
          </button>
          <p className="text-xs text-muted-foreground">
            Deleting your account permanently will be supported in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
