'use client';

import Link from 'next/link';
import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiClient, ApiError } from '@/services/apiClient';
import type { Profile } from '@/types/profile';

interface FormState {
  displayName: string;
  bio: string;
  location: string;
  isDiscoverable: boolean;
  showLocation: boolean;
}

export function EditProfileContainer() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiClient.profile.me();
        if (cancelled) return;
        setProfile(data);
        setForm({
          displayName: data.displayName,
          bio: data.bio ?? '',
          location: data.location ?? '',
          isDiscoverable: data.isDiscoverable,
          showLocation: data.showLocation,
        });
      } catch {
        if (cancelled) return;
        setError('Unable to load profile for editing. Please try again.');
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return;
    const { name, value, type } = event.target;
    const checked = type === 'checkbox' && 'checked' in event.target ? event.target.checked : false;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    } as FormState);
  };

  const initials = profile?.displayName
    ? profile.displayName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NF';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await apiClient.profile.update({
        displayName: form.displayName,
        bio: form.bio || null,
        location: form.location || null,
        isDiscoverable: form.isDiscoverable,
        showLocation: form.showLocation,
      });
      setProfile(updated);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.message
          ? err.message
          : 'Unable to save your profile. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarFile = async (file: File) => {
    setAvatarError(null);

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setAvatarError('Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5MB.');
      return;
    }

    setAvatarUploading(true);

    try {
      const uploadInfo = await apiClient.profile.requestAvatarUpload({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      const uploadResponse = await fetch(uploadInfo.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const { avatarUrl } = await apiClient.profile.confirmAvatar({
        avatarKey: uploadInfo.avatarKey,
      });

      setProfile((prev) => (prev ? { ...prev, avatarUrl } : prev));
    } catch (err) {
      const msg =
        err instanceof ApiError && err.message ? err.message : 'Upload failed. Please try again.';
      setAvatarError(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(null);
    setAvatarUploading(true);

    try {
      await apiClient.profile.removeAvatar();
      setProfile((prev) => (prev ? { ...prev, avatarUrl: null } : prev));
    } catch (err) {
      const msg =
        err instanceof ApiError && err.message
          ? err.message
          : 'Could not remove photo. Please try again.';
      setAvatarError(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!form || !profile) {
    return (
      <Card>
        <CardContent className="py-6">
          {error ? (
            <p className="text-sm text-[hsl(var(--accent-error))]">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold">Edit Profile</h1>
          <p className="text-sm text-on-surface-variant">
            Update your presence and public identity.
          </p>
        </div>
        <Button
          type="submit"
          form="edit-profile-form"
          disabled={isSubmitting}
          className="hidden md:inline-flex"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-6">
        <Card className="overflow-visible rounded-[28px]">
          <CardContent className="p-0">
            <div className="relative h-44 rounded-t-[28px] bg-[radial-gradient(circle_at_20%_15%,#ec7f4a_0%,transparent_35%),radial-gradient(circle_at_80%_18%,#37a6a0_0%,transparent_33%),linear-gradient(120deg,#68836e_0%,#b65a63_40%,#2e9489_100%)]">
              <button
                type="button"
                className="absolute right-4 top-4 rounded-full bg-black/20 p-2 text-white"
                aria-label="Change cover photo"
              >
                <span className="material-symbols-outlined">add_a_photo</span>
              </button>
            </div>
            <div className="relative px-6 pb-6 pt-5">
              <div className="-mt-16 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-28 w-28 border-4 border-white shadow-card">
                  <AvatarImage src={profile.avatarUrl || ''} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? 'Uploading…' : 'Update avatar'}
                  </Button>
                  {profile.avatarUrl ? (
                    <Button type="button" variant="ghost" onClick={() => void handleRemoveAvatar()}>
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
              {avatarError ? <p className="mt-2 text-sm text-destructive">{avatarError}</p> : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleAvatarFile(f);
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle className="text-xl">Public profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  required
                  maxLength={50}
                  value={form.displayName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" value={`@${profile.username}`} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                maxLength={250}
                value={form.bio}
                onChange={handleChange}
                className="min-h-[120px]"
              />
              <p className="text-right text-xs text-on-surface-variant">{form.bio.length}/250</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  maxLength={100}
                  value={form.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input id="website" value="Not connected" disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px]">
          <CardHeader>
            <CardTitle className="text-xl">Privacy controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <div>
                <p className="text-sm font-medium">Profile discoverable</p>
                <p className="text-xs text-on-surface-variant">
                  Allow others to find your profile in search.
                </p>
              </div>
              <Switch
                checked={form.isDiscoverable}
                onCheckedChange={(checked) =>
                  setForm((prev) => (prev ? { ...prev, isDiscoverable: checked } : prev))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
              <div>
                <p className="text-sm font-medium">Show location</p>
                <p className="text-xs text-on-surface-variant">Display your location publicly.</p>
              </div>
              <Switch
                checked={form.showLocation}
                onCheckedChange={(checked) =>
                  setForm((prev) => (prev ? { ...prev, showLocation: checked } : prev))
                }
              />
            </div>
          </CardContent>
        </Card>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/profile">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="md:hidden">
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
