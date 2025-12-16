'use client';

import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CreatorProfile {
  bio: string | null;
  coverImageUrl: string | null;
  socialLinks: Record<string, string>;
  user: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

export default function EditProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    bio: '',
    coverImageUrl: '',
    socialLinks: {
      twitter: '',
      instagram: '',
      website: '',
    },
  });

  useEffect(() => {
    void fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/creator/profile');
      if (response.ok) {
        const data: CreatorProfile = await response.json();
        const links = (data.socialLinks as Record<string, string>) || {};
        setProfile({
          bio: data.bio ?? '',
          coverImageUrl: data.coverImageUrl ?? '',
          socialLinks: {
            twitter: links['twitter'] ?? '',
            instagram: links['instagram'] ?? '',
            website: links['website'] ?? '',
          },
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/creator/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: profile.bio,
          coverImageUrl: profile.coverImageUrl || undefined,
          socialLinks: profile.socialLinks,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">Update your creator profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>}
        {success && (
          <div className="rounded-lg bg-green-100 p-4 text-green-800">
            Profile updated successfully!
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Tell your fans about yourself</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={5}
                placeholder="Share your story..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover Image URL</Label>
              <Input
                id="coverImageUrl"
                type="url"
                value={profile.coverImageUrl}
                onChange={(e) => setProfile({ ...profile, coverImageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect your social profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input
                id="twitter"
                value={profile.socialLinks.twitter}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, twitter: e.target.value },
                  })
                }
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={profile.socialLinks.instagram}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, instagram: e.target.value },
                  })
                }
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={profile.socialLinks.website}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    socialLinks: { ...profile.socialLinks, website: e.target.value },
                  })
                }
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
