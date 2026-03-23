'use client';

import Link from 'next/link';

import { TrendingCreators } from '@/components/explore/TrendingCreators';
import { RailCard, RailHeading, RailSection } from '@/components/layout/AppRailLayout';

const TAGS = [
  'summershoot',
  'workoutroutine',
  'digitalart',
  'behindthescenes',
  'morningyoga',
  'travelvlog',
];

/** Right-rail bundle for Discover / Explore — shared padding via AppRailLayout. */
export function ExploreRailContent({ showLiveTeaser = true }: { showLiveTeaser?: boolean }) {
  return (
    <>
      <RailSection>
        <RailHeading>New creators</RailHeading>
        <TrendingCreators variant="rail" hideHeading />
      </RailSection>
      {showLiveTeaser ? <ExploreLiveTeaser /> : null}
      <ExploreTrendingTags />
      <ExploreRailFooter />
    </>
  );
}

function ExploreLiveTeaser() {
  return (
    <RailSection>
      <div className="flex items-center justify-between gap-2">
        <RailHeading className="mb-0">Live right now</RailHeading>
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-tertiary" aria-hidden />
      </div>
      <RailCard className="p-0">
        <Link href="/live" className="group block overflow-hidden rounded-xl">
          <div className="relative aspect-video bg-surface-container-high">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute left-2 top-2 rounded bg-tertiary px-2 py-0.5 text-[8px] font-black uppercase text-white">
              Live
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <p className="truncate text-[10px] font-bold text-white">Browse live streams</p>
              <p className="mt-0.5 flex items-center gap-1 text-[8px] text-white/80">
                <span className="material-symbols-outlined text-[10px]">visibility</span>
                Join the community
              </p>
            </div>
          </div>
        </Link>
      </RailCard>
    </RailSection>
  );
}

/**
 * Static discover rail blocks (tags + footer) — keeps spacing consistent via RailSection.
 */
export function ExploreTrendingTags() {
  return (
    <RailSection>
      <RailHeading>Trending tags</RailHeading>
      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <Link
            key={tag}
            href={`/explore?q=${encodeURIComponent(`#${tag}`)}`}
            className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:bg-primary/10 hover:text-primary"
          >
            #{tag}
          </Link>
        ))}
      </div>
    </RailSection>
  );
}

export function ExploreRailFooter() {
  return (
    <div className="space-y-2 border-t border-surface-container-high/80 pt-8 text-[10px] text-on-surface-variant/70">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <Link href="/" className="hover:underline">
          About
        </Link>
        <span aria-hidden className="text-on-surface-variant/40">
          ·
        </span>
        <span className="cursor-not-allowed hover:underline">Help</span>
        <span aria-hidden className="text-on-surface-variant/40">
          ·
        </span>
        <span className="cursor-not-allowed hover:underline">Terms</span>
        <span aria-hidden className="text-on-surface-variant/40">
          ·
        </span>
        <span className="cursor-not-allowed hover:underline">Privacy</span>
      </div>
      <p>© {new Date().getFullYear()} NuttyFans</p>
    </div>
  );
}
