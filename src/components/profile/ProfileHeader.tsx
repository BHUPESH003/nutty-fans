import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Profile } from '@/types/profile';

interface ProfileHeaderProps {
  profile: Profile;
  isSelf: boolean;
}

export function ProfileHeader({ profile, isSelf }: ProfileHeaderProps) {
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
    <section className="mb-4 flex flex-col items-start gap-4 md:flex-row md:items-center">
      <Avatar className="size-24 md:size-28">
        {profile.avatarUrl ? (
          <AvatarImage src={profile.avatarUrl} alt={`${profile.displayName}'s profile photo`} />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <h1 className="text-h3">{profile.displayName || profile.username}</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {profile.showLocation && profile.location ? <span>📍 {profile.location}</span> : null}
          <span>
            📅 Joined{' '}
            {new Date(profile.joinDate).toLocaleString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>
      <div className="w-full md:w-auto">
        {isSelf ? (
          <Button asChild className="w-full md:w-auto">
            <a href="/profile/edit">Edit Profile</a>
          </Button>
        ) : (
          <Button className="w-full md:w-auto" variant="outline" disabled>
            Follow
          </Button>
        )}
      </div>
    </section>
  );
}
