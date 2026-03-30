'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { RailCard, RailHeading, RailSection } from '@/components/layout/AppRailLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/services/apiClient';

interface RailCreator {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  subscriberCount: number;
}

interface SubscriptionItem {
  id: string;
  status: string;
  expiresAt: Date | string;
  creator: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl: string | null;
  };
}

/** Right-rail bundle for Discover / Explore — shared padding via AppRailLayout. */
export function ExploreRailContent({ showLiveTeaser = true }: { showLiveTeaser?: boolean }) {
  const [creators, setCreators] = useState<RailCreator[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);

  useEffect(() => {
    const loadRailData = async () => {
      try {
        const result = await apiClient.search.getTrendingCreators(12);
        setCreators(result.creators || []);
      } catch (error) {
        console.error('Failed to load rail creators:', error);
      }

      try {
        const result = await apiClient.subscriptions.list();
        setSubscriptions(result.subscriptions || []);
      } catch {
        // Public visitors may not have subscription access; keep section empty.
        setSubscriptions([]);
      }
    };

    void loadRailData();
  }, []);

  const suggestedCreators = useMemo(() => creators.slice(0, 3), [creators]);
  const newCreators = useMemo(() => creators.slice(3, 8), [creators]);
  const expiredSubscriptions = useMemo(
    () => subscriptions.filter((item) => item.status === 'expired').slice(0, 4),
    [subscriptions]
  );

  return (
    <>
      <RailSection>
        <RailHeading>Suggested creators</RailHeading>
        <RailCard className="space-y-3 rounded-3xl border-transparent bg-surface-container-lowest p-4 shadow-sm">
          {suggestedCreators.length === 0 ? (
            <p className="text-xs text-on-surface-variant">No suggestions yet.</p>
          ) : (
            suggestedCreators.map((creator) => (
              <CreatorListItem key={creator.id} creator={creator} />
            ))
          )}
        </RailCard>
      </RailSection>

      <RailSection>
        <RailHeading>New creators</RailHeading>
        <RailCard className="space-y-3 rounded-3xl border-transparent bg-surface-container-lowest p-4 shadow-sm">
          {newCreators.length === 0 ? (
            <p className="text-xs text-on-surface-variant">No new creators right now.</p>
          ) : (
            newCreators.map((creator) => <CreatorListItem key={creator.id} creator={creator} />)
          )}
        </RailCard>
      </RailSection>

      <RailSection>
        <RailHeading>Expired subscriptions</RailHeading>
        <RailCard className="space-y-3 rounded-3xl border-transparent bg-surface-container-lowest p-4 shadow-sm">
          {expiredSubscriptions.length === 0 ? (
            <p className="text-xs text-on-surface-variant">No expired subscriptions.</p>
          ) : (
            expiredSubscriptions.map((subscription) => (
              <ExpiredSubscriptionItem key={subscription.id} subscription={subscription} />
            ))
          )}
        </RailCard>
      </RailSection>

      {showLiveTeaser ? <ExploreRailFooter /> : null}
    </>
  );
}

function CreatorListItem({ creator }: { creator: RailCreator }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/c/${creator.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={creator.avatarUrl || ''} alt="" />
          <AvatarFallback className="text-xs">{creator.displayName[0] || 'N'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-on-surface">{creator.displayName}</p>
          <p className="truncate text-[11px] text-on-surface-variant">
            {Math.max(creator.subscriberCount, 0).toLocaleString()} fans
          </p>
        </div>
      </Link>
      <Link
        href={`/c/${creator.handle}`}
        className="rounded-full border border-primary/30 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        Follow
      </Link>
    </div>
  );
}

function ExpiredSubscriptionItem({ subscription }: { subscription: SubscriptionItem }) {
  const expiredDate = new Date(subscription.expiresAt);
  const formattedDate = Number.isNaN(expiredDate.valueOf())
    ? 'Expired'
    : `Expired ${expiredDate.toLocaleDateString()}`;

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/c/${subscription.creator.handle}`}
        className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden"
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={subscription.creator.avatarUrl || ''} alt="" />
          <AvatarFallback className="text-xs">
            {subscription.creator.displayName[0] || 'N'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-on-surface">
            {subscription.creator.displayName}
          </p>
          <p className="truncate text-[11px] text-on-surface-variant">{formattedDate}</p>
        </div>
      </Link>
      <Link
        href={`/c/${subscription.creator.handle}`}
        className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
      >
        Renew
      </Link>
    </div>
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
