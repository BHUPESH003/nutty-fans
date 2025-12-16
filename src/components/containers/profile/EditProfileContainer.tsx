'use client';

import * as React from 'react';

import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return;
    const { name, value, type } = event.target;
    const checked = type === 'checkbox' && 'checked' in event.target ? event.target.checked : false;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    } as FormState);
  };

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
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <AvatarUploader
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            isUploading={avatarUploading}
            error={avatarError}
            onFileSelected={handleAvatarFile}
            onRemove={handleRemoveAvatar}
          />

          <div className="space-y-4">
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
              <p className="text-xs text-muted-foreground">Max 50 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" value={profile.username} disabled />
              <p className="text-xs text-muted-foreground">Username cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                maxLength={160}
                value={form.bio}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">{form.bio.length}/160 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                maxLength={100}
                value={form.location}
                onChange={handleChange}
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isDiscoverable"
                  checked={form.isDiscoverable}
                  onChange={handleChange}
                />
                <span>Profile Discoverability</span>
              </label>
              <p className="pl-6 text-xs text-muted-foreground">
                Allow others to find your profile in search.
              </p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="showLocation"
                  checked={form.showLocation}
                  onChange={handleChange}
                />
                <span>Show Location</span>
              </label>
              <p className="pl-6 text-xs text-muted-foreground">
                Display location on your public profile.
              </p>
            </div>
          </div>

          {error ? <p className="text-sm text-[hsl(var(--accent-error))]">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <a href="/profile">Cancel</a>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
