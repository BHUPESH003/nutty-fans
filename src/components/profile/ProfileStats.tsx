interface ProfileStatsProps {
  followersCount: number;
  followingCount: number;
}

export function ProfileStats({ followersCount, followingCount }: ProfileStatsProps) {
  const format = (value: number) => new Intl.NumberFormat().format(value);

  return (
    <section className="mb-4 flex gap-6 text-center text-sm">
      <div>
        <div className="text-base font-semibold">{format(followersCount)}</div>
        <div className="text-xs text-muted-foreground">Followers</div>
      </div>
      <div>
        <div className="text-base font-semibold">{format(followingCount)}</div>
        <div className="text-xs text-muted-foreground">Following</div>
      </div>
    </section>
  );
}
