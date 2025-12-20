import { MapPin, Calendar, MessageCircle, MoreHorizontal } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Profile } from '@/types/profile';

interface ProfileHeaderProps {
  profile: Profile;
  isSelf: boolean;
  coverUrl?: string;
  stats?: {
    followers: number;
    following: number;
    posts: number;
  };
}

export function ProfileHeader({ profile, isSelf, coverUrl, stats }: ProfileHeaderProps) {
  const initials = (() => {
    const source = profile.displayName || profile.username;
    return source
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  })();

  return (
    <div className="relative mb-8">
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden rounded-b-3xl md:h-80">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-black/60" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${coverUrl || 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop'})`,
          }}
        />
      </div>

      <div className="relative z-20 -mt-12 flex flex-col items-end gap-4 px-4 md:flex-row md:items-start md:px-8">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="size-24 border-4 border-background shadow-xl md:size-32">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={`${profile.displayName}'s profile photo`} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>

        {/* Actions & Info */}
        <div className="mt-2 flex w-full flex-1 flex-col justify-between gap-4 md:mt-12 md:w-auto md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold md:text-3xl">
              {profile.displayName || profile.username}
            </h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          <div className="flex gap-2">
            {isSelf ? (
              <Button variant="outline" className="rounded-full" asChild>
                <a href="/profile/edit">Edit Profile</a>
              </Button>
            ) : (
              <>
                <Button className="rounded-full bg-primary hover:bg-primary/90">Follow</Button>
                <Button variant="secondary" className="rounded-full">
                  <MessageCircle className="mr-2 size-4" />
                  Message
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreHorizontal className="size-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bio & Stats */}
      <div className="mt-6 space-y-4 px-4 md:px-8">
        {/* Stats Row */}
        <div className="flex gap-6 text-sm">
          <div className="flex gap-1">
            <span className="font-bold text-foreground">{stats?.posts || 0}</span>{' '}
            <span className="text-muted-foreground">Posts</span>
          </div>
          <div className="flex gap-1">
            <span className="font-bold text-foreground">{stats?.followers || 0}</span>{' '}
            <span className="text-muted-foreground">Followers</span>
          </div>
          <div className="flex gap-1">
            <span className="font-bold text-foreground">{stats?.following || 0}</span>{' '}
            <span className="text-muted-foreground">Following</span>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && <p className="max-w-2xl text-sm md:text-base">{profile.bio}</p>}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {profile.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} /> {profile.location}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar size={14} /> Joined{' '}
            {new Date(profile.joinDate).toLocaleString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
