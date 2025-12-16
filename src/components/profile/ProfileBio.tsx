interface ProfileBioProps {
  bio: string | null;
  isSelf: boolean;
}

export function ProfileBio({ bio, isSelf }: ProfileBioProps) {
  if (!bio) {
    return (
      <section className="mt-4">
        <h2 className="mb-1 text-sm font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">
          No bio yet
          {isSelf ? (
            <>
              .{' '}
              <a href="/profile/edit" className="underline">
                Add a bio →
              </a>
            </>
          ) : null}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <h2 className="mb-1 text-sm font-semibold">About</h2>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{bio}</p>
    </section>
  );
}
