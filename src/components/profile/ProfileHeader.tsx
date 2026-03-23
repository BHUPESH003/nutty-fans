import Link from 'next/link';

import { CreatorCTA } from '@/components/creator/CreatorCTA';
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
      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-b-[24px] md:aspect-auto md:h-80">
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
          <Avatar className="size-24 border-4 border-surface-container-lowest shadow-card md:size-32">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt={`${profile.displayName}'s profile photo`} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>

        {/* Actions & Info */}
        <div className="mt-2 flex w-full flex-1 flex-col justify-between gap-4 md:mt-12 md:w-auto md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="font-headline text-2xl font-bold text-on-surface md:text-3xl">
              {profile.displayName || profile.username}
            </h1>
            <p className="text-on-surface-variant">@{profile.username}</p>
          </div>

          <div className="flex gap-2">
            {isSelf ? (
              <>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href="/profile/edit">Edit Profile</Link>
                </Button>
                <CreatorCTA variant="compact" />
              </>
            ) : (
              <>
                <Button className="rounded-full bg-primary-container font-headline font-bold text-white shadow-ambient hover:opacity-90">
                  Follow
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-outline-variant font-bold text-primary"
                >
                  <span className="material-symbols-outlined mr-2 text-[18px]">chat_bubble</span>
                  Message
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <span className="material-symbols-outlined text-[22px]">more_horiz</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bio & Stats */}
      <div className="mt-6 space-y-4 px-4 md:px-8">
        {/* Stats Row */}
        <div className="flex gap-8 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="font-headline text-xl font-black text-on-surface">
              {stats?.posts || 0}
            </span>
            <span className="text-xs text-on-surface-variant">Posts</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-headline text-xl font-black text-on-surface">
              {stats?.followers || 0}
            </span>
            <span className="text-xs text-on-surface-variant">Followers</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-headline text-xl font-black text-on-surface">
              {stats?.following || 0}
            </span>
            <span className="text-xs text-on-surface-variant">Following</span>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && <p className="max-w-2xl text-sm md:text-base">{profile.bio}</p>}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
          {profile.location && (
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {profile.location}
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            Joined{' '}
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
