'use client';

import { signOut } from 'next-auth/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient, ApiError } from '@/services/apiClient';
import type { SettingsResponse } from '@/types/settings';

export function SettingsPageContainer() {
  const [settings, setSettings] = React.useState<SettingsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingField, setSavingField] = React.useState<string | null>(null);

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
    (field: keyof SettingsResponse) => async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!settings) return;

      const previous = settings[field];
      const nextValue = event.target.checked;

      setSettings({ ...settings, [field]: nextValue });
      setSavingField(field);

      try {
        const updated = await apiClient.settings.update({
          [field]: nextValue,
        } as Partial<SettingsResponse>);
        setSettings(updated);
      } catch {
        setSettings({ ...settings, [field]: previous });
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
              checked={settings.emailNotificationsEnabled}
              onChange={handleToggle('emailNotificationsEnabled')}
              disabled={savingField === 'emailNotificationsEnabled'}
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
              checked={settings.marketingEmailsEnabled}
              onChange={handleToggle('marketingEmailsEnabled')}
              disabled={savingField === 'marketingEmailsEnabled'}
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
              checked={settings.platformUpdatesEnabled}
              onChange={handleToggle('platformUpdatesEnabled')}
              disabled={savingField === 'platformUpdatesEnabled'}
            />
          </label>
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
              checked={settings.isDiscoverable}
              onChange={handleToggle('isDiscoverable')}
              disabled={savingField === 'isDiscoverable'}
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
              checked={settings.showLocation}
              onChange={handleToggle('showLocation')}
              disabled={savingField === 'showLocation'}
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
