'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { MediaRenderer } from '@/components/media/MediaRenderer';
import { SubscribeModal } from '@/components/payments/SubscribeModal';
import { TipButton } from '@/components/payments/TipButton';
import { PostCard } from '@/components/posts/PostCard';
import { useAuthPrompt } from '@/components/providers/AuthPromptProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn, formatCurrency } from '@/lib/utils';
import { apiClient, request } from '@/services/apiClient';
import type { MediaItem, PostWithCreator } from '@/types/content';
import type { SubscriptionPlanType } from '@/types/payments';

interface CreatorProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  isVerified: boolean;
  subscriberCount: number;
  postCount: number;
  subscriptionPrice: number;
  socialLinks: Record<string, string>;
  category: { id: string; name: string } | null;
  isSubscribed: boolean;
}

interface SubscriptionPlan {
  planType: SubscriptionPlanType;
  months: number;
  basePrice: number;
  discount: number;
  finalPrice: number;
}

interface PublicBundle {
  id: string;
  title: string;
  description: string | null;
  price: unknown;
  originalPrice: unknown;
  coverImageUrl: string | null;
  itemCount: number;
  isPurchased?: boolean;
}

interface CreatorMediaEntry {
  id: string;
  media: MediaItem;
  post: PostWithCreator;
}

interface CreatorProfileContainerProps {
  handle: string;
  activeTab?: 'posts' | 'media';
}

function normalizePlanType(raw: string): SubscriptionPlanType {
  switch (raw) {
    case '3month':
      return 'threemonth';
    case '6month':
      return 'sixmonth';
    case '12month':
      return 'twelvemonth';
    default:
      return raw as SubscriptionPlanType;
  }
}

function formatPriceUnknown(price: unknown) {
  const numericPrice = typeof price === 'number' ? price : Number(price);
  return Number.isFinite(numericPrice) ? formatCurrency(numericPrice) : '$0.00';
}

function getMediaTileUrl(media: MediaItem) {
  if (media.thumbnailUrl) return media.thumbnailUrl;
  if (media.previewUrl) return media.previewUrl;
  if (media.mediaType === 'image' && media.originalUrl !== 'locked') return media.originalUrl;
  return null;
}

function getSocialIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes('instagram')) return 'photo_camera';
  if (normalized.includes('twitter') || normalized.includes('x')) return 'alternate_email';
  if (normalized.includes('youtube')) return 'play_circle';
  if (normalized.includes('tiktok')) return 'music_note';
  if (normalized.includes('discord')) return 'forum';

  return 'link';
}

function CreatorSidebarCard({
  creator,
  plans,
  bundles,
  onSubscribeClick,
  onBundlePurchase,
  isAuthenticated,
}: {
  creator: CreatorProfile;
  plans: SubscriptionPlan[];
  bundles: PublicBundle[];
  onSubscribeClick: () => void;
  onBundlePurchase: (bundleId: string) => Promise<boolean>;
  isAuthenticated: boolean;
}) {
  const lowestPlan = [...plans].sort((a, b) => a.finalPrice - b.finalPrice)[0];
  const socialLinks = Object.entries(creator.socialLinks ?? {}).filter(([, url]) => !!url);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border border-border bg-surface-container-lowest text-on-surface shadow-modal">
        <CardContent className="space-y-5 p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Subscription
            </p>
            <h3 className="text-2xl font-bold leading-tight">
              {creator.isSubscribed
                ? `You're subscribed to ${creator.displayName}`
                : `Unlock ${creator.displayName}`}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {creator.isSubscribed
                ? 'You already have access to subscriber-only drops, media, and private interactions.'
                : 'Get access to the full post feed, locked media, bundles, and private fan actions.'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-container-low p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {lowestPlan
                    ? `${formatCurrency(lowestPlan.finalPrice)} for ${lowestPlan.months} month${lowestPlan.months > 1 ? 's' : ''}`
                    : `${formatCurrency(creator.subscriptionPrice)} / month`}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {lowestPlan?.discount
                    ? `Save ${Math.round(lowestPlan.discount * 100)}% on the best available plan`
                    : 'Monthly membership with exclusive creator access'}
                </p>
              </div>
              {creator.isSubscribed ? (
                <Badge className="border-emerald-400/40 bg-emerald-500/10 text-emerald-300">
                  Active
                </Badge>
              ) : null}
            </div>
          </div>

          <Button
            className="h-12 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={onSubscribeClick}
            disabled={creator.isSubscribed}
          >
            {creator.isSubscribed
              ? 'Subscribed'
              : `Subscribe for ${formatCurrency(creator.subscriptionPrice)}/month`}
          </Button>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-border bg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Posts</p>
              <p className="mt-2 text-xl font-semibold text-on-surface">{creator.postCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-container-low p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-on-surface-variant">Fans</p>
              <p className="mt-2 text-xl font-semibold text-on-surface">
                {creator.subscriberCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {bundles.length > 0 ? (
        <Card className="border border-border bg-surface-container-lowest text-on-surface">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                Bundles
              </h3>
              <span className="text-xs text-on-surface-variant">{bundles.length} available</span>
            </div>

            <div className="space-y-3">
              {bundles.slice(0, 3).map((bundle) => (
                <div
                  key={bundle.id}
                  className="rounded-2xl border border-border bg-surface-container-low p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-on-surface">
                        {bundle.title}
                      </p>
                      {bundle.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                          {bundle.description}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                        <span>{formatPriceUnknown(bundle.price)}</span>
                        {bundle.originalPrice ? (
                          <span className="line-through">
                            {formatPriceUnknown(bundle.originalPrice)}
                          </span>
                        ) : null}
                        <span>{bundle.itemCount} items</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={bundle.isPurchased ? 'outline' : 'secondary'}
                      disabled={!!bundle.isPurchased}
                      className={cn(
                        'rounded-full',
                        !bundle.isPurchased &&
                          'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                      onClick={() => void onBundlePurchase(bundle.id)}
                    >
                      {bundle.isPurchased ? 'Owned' : isAuthenticated ? 'Buy' : 'Unlock'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {socialLinks.length > 0 ? (
        <Card className="border border-border bg-surface-container-lowest text-on-surface">
          <CardContent className="space-y-3 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              Links
            </h3>
            <div className="space-y-2">
              {socialLinks.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface-container-low px-4 py-3 text-sm text-on-surface transition hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    {getSocialIcon(platform)}
                  </span>
                  <span className="truncate">{platform}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function CreatorProfileContainer({
  handle,
  activeTab = 'posts',
}: CreatorProfileContainerProps) {
  const router = useRouter();
  const { requireAuth, isAuthenticated } = useAuthPrompt();

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [posts, setPosts] = useState<PostWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [bundles, setBundles] = useState<PublicBundle[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  const fetchCreatorProfile = useCallback(async () => {
    try {
      const data = await apiClient.creator.getPublicProfile(handle);
      setCreator(data);
    } catch (error) {
      console.error('Failed to fetch creator profile:', error);
    }
  }, [handle]);

  const fetchBundles = useCallback(async () => {
    try {
      const data = await apiClient.bundles.listPublicByHandle(handle);
      setBundles((data.bundles || []) as PublicBundle[]);
    } catch (error) {
      console.error('Failed to fetch creator bundles:', error);
    }
  }, [handle]);

  const fetchPlans = useCallback(async (creatorId: string) => {
    try {
      const data = await request<{ plans: SubscriptionPlan[] }>(
        `/api/subscriptions/plans/${creatorId}`
      );
      setPlans(data.plans);
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
    }
  }, []);

  const fetchPosts = useCallback(
    async (cursor?: string) => {
      try {
        const data = await apiClient.creator.getPublicPosts(handle, cursor);
        if (cursor) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error('Failed to fetch creator posts:', error);
      }
    },
    [handle]
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchCreatorProfile();
      setIsLoading(false);
    };

    void load();
  }, [fetchCreatorProfile]);

  useEffect(() => {
    if (!creator) return;

    void fetchPlans(creator.id);
    void fetchPosts();
    void fetchBundles();
  }, [creator, fetchBundles, fetchPlans, fetchPosts]);

  const mediaEntries = useMemo<CreatorMediaEntry[]>(
    () =>
      posts.flatMap((post) =>
        post.media.map((media, index) => ({
          id: `${post.id}-${media.id}-${index}`,
          media,
          post,
        }))
      ),
    [posts]
  );

  const selectedMedia = selectedMediaIndex !== null ? mediaEntries[selectedMediaIndex] : null;

  const socialLinks = useMemo(
    () => Object.entries(creator?.socialLinks ?? {}).filter(([, url]) => !!url),
    [creator?.socialLinks]
  );

  const handleSubscribeClick = useCallback(() => {
    if (!creator || creator.isSubscribed) return;
    if (!requireAuth('subscribe to this creator')) return;
    setShowSubscribeModal(true);
  }, [creator, requireAuth]);

  const handleSubscribe = useCallback(
    async (planType: string, _paymentSource: 'wallet' | 'card') => {
      if (!creator) return;

      setIsSubscribing(true);
      try {
        await apiClient.subscriptions.subscribe(creator.id, normalizePlanType(planType));
        setShowSubscribeModal(false);
        await fetchCreatorProfile();
        await fetchPosts();
      } catch (error) {
        console.error('Failed to subscribe:', error);
        throw error;
      } finally {
        setIsSubscribing(false);
      }
    },
    [creator, fetchCreatorProfile, fetchPosts]
  );

  const handleLike = useCallback(
    async (postId: string) => {
      if (!requireAuth('like this post')) return false;

      try {
        await apiClient.content.toggleLike(postId);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !post.isLiked,
                  likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
                }
              : post
          )
        );
        return true;
      } catch (error) {
        console.error('Failed to toggle like:', error);
        return false;
      }
    },
    [requireAuth]
  );

  const handleBookmark = useCallback(
    async (postId: string) => {
      if (!requireAuth('bookmark this post')) return false;

      try {
        await apiClient.content.toggleBookmark(postId);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isBookmarked: !post.isBookmarked,
                }
              : post
          )
        );
        return true;
      } catch (error) {
        console.error('Failed to toggle bookmark:', error);
        return false;
      }
    },
    [requireAuth]
  );

  const handleUnlock = useCallback(
    async (postId: string) => {
      if (!requireAuth('unlock this post')) return false;

      try {
        await apiClient.payments.unlockPpv(postId);
        await fetchPosts();
        return true;
      } catch (error) {
        console.error('Failed to unlock post:', error);
        return false;
      }
    },
    [fetchPosts, requireAuth]
  );

  const handleBundlePurchase = useCallback(
    async (bundleId: string) => {
      if (!requireAuth('buy this bundle')) return false;

      try {
        await apiClient.bundles.purchase(bundleId);
        await fetchBundles();
        await fetchPosts();
        return true;
      } catch (error) {
        console.error('Failed to purchase bundle:', error);
        return false;
      }
    },
    [fetchBundles, fetchPosts, requireAuth]
  );

  const handleMessageClick = useCallback(() => {
    if (!requireAuth('message this creator')) return;
    if (!creator) return;

    void apiClient.profile
      .byHandle(creator.handle)
      .then((profile) => apiClient.messaging.createConversation(profile.id))
      .then((conversation) => {
        router.push(`/messages/${conversation.id}`);
      })
      .catch((error) => {
        console.error('Failed to start creator conversation:', error);
        router.push('/messages');
      });
  }, [creator, requireAuth, router]);

  const handleShareClick = useCallback(async () => {
    if (typeof window === 'undefined' || !creator) return;

    const shareUrl = `${window.location.origin}/c/${creator.handle}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: creator.displayName,
          text: `Check out ${creator.displayName} on NuttyFans`,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Failed to share creator profile:', error);
    }
  }, [creator]);

  if (isLoading || !creator) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1480px] gap-0 xl:px-6">
        <div className="min-w-0 flex-1 border-x border-border bg-surface-container-lowest">
          <div className="relative h-[240px] overflow-hidden border-b border-border bg-surface-container-high sm:h-[320px]">
            {creator.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.coverImageUrl}
                alt={`${creator.displayName} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top_right,_rgba(233,30,99,0.24),_transparent_30%),linear-gradient(135deg,hsl(var(--primary-container))_0%,hsl(var(--surface-container-high))_45%,hsl(var(--surface-container-lowest))_100%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(233,30,99,0.24),_transparent_30%),linear-gradient(135deg,#23121a_0%,#16141c_45%,#101018_100%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
          </div>

          <div className="relative px-4 pb-8 sm:px-6">
            <div className="-mt-16 flex flex-col gap-5 sm:-mt-20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                  <Avatar className="h-28 w-28 border-4 border-background bg-surface-container sm:h-36 sm:w-36">
                    <AvatarImage src={creator.avatarUrl ?? undefined} alt={creator.displayName} />
                    <AvatarFallback className="bg-surface-container text-4xl text-on-surface">
                      {creator.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                        {creator.displayName}
                      </h1>
                      {creator.isVerified ? (
                        <span className="material-symbols-outlined text-[22px] text-primary">
                          verified
                        </span>
                      ) : null}
                      {creator.category ? (
                        <Badge className="border-border bg-surface-container-low text-on-surface">
                          {creator.category.name}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-on-surface-variant">
                      <span>@{creator.handle}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{creator.subscriberCount.toLocaleString()} fans</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{mediaEntries.length} media</span>
                    </div>

                    {creator.bio ? (
                      <p className="max-w-2xl whitespace-pre-wrap text-sm leading-6 text-on-surface">
                        {creator.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-on-surface-variant">
                        Premium creator feed with subscriber-only drops and media.
                      </p>
                    )}

                    {socialLinks.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {socialLinks.map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface transition hover:bg-surface-container"
                          >
                            <span className="material-symbols-outlined text-[16px] text-primary">
                              {getSocialIcon(platform)}
                            </span>
                            <span>{platform}</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleSubscribeClick}
                    disabled={creator.isSubscribed || isSubscribing}
                    className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {creator.isSubscribed
                      ? 'Subscribed'
                      : `Subscribe ${formatCurrency(creator.subscriptionPrice)}/mo`}
                  </Button>
                  <TipButton
                    creatorId={creator.id}
                    creatorName={creator.displayName}
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-full border-outline-variant bg-surface-container-lowest px-5 text-primary hover:bg-primary/10"
                    onBeforeOpen={() => requireAuth('send a tip')}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-11 rounded-full border-outline-variant bg-surface-container-lowest px-5 text-primary hover:bg-primary/10"
                    onClick={handleMessageClick}
                  >
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-full border-outline-variant bg-surface-container-lowest text-primary hover:bg-primary/10"
                    onClick={() => void handleShareClick()}
                  >
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center sm:max-w-md">
                <div className="rounded-2xl border border-border bg-surface-container-low px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                    Posts
                  </p>
                  <p className="mt-2 text-xl font-semibold text-on-surface">{creator.postCount}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-container-low px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                    Media
                  </p>
                  <p className="mt-2 text-xl font-semibold text-on-surface">
                    {mediaEntries.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-container-low px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                    Price
                  </p>
                  <p className="mt-2 text-xl font-semibold text-on-surface">
                    {formatCurrency(creator.subscriptionPrice)}
                  </p>
                </div>
              </div>

              <div className="xl:hidden">
                <CreatorSidebarCard
                  creator={creator}
                  plans={plans}
                  bundles={bundles}
                  onSubscribeClick={handleSubscribeClick}
                  onBundlePurchase={handleBundlePurchase}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-10 border-y border-border bg-background/95 backdrop-blur">
            <div className="flex px-4 sm:px-6">
              {[
                { key: 'posts', label: 'Posts', href: `/c/${creator.handle}` },
                { key: 'media', label: 'Media', href: `/c/${creator.handle}/media` },
              ].map((tab) => {
                const isActive = activeTab === tab.key;

                return (
                  <Link
                    key={tab.key}
                    href={tab.href as Route}
                    className={cn(
                      'relative inline-flex min-w-[120px] items-center justify-center px-4 py-4 text-sm font-semibold transition',
                      isActive ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                    )}
                  >
                    {tab.label}
                    {isActive ? (
                      <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 px-4 py-6 sm:px-6">
            {activeTab === 'media' ? (
              mediaEntries.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {mediaEntries.map((entry, index) => {
                    const isLocked = !entry.post.hasAccess && entry.post.accessLevel !== 'free';
                    const tileUrl = getMediaTileUrl(entry.media);

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setSelectedMediaIndex(index)}
                        className="group relative aspect-square overflow-hidden rounded-[22px] border border-border bg-surface-container-high text-left"
                      >
                        {tileUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tileUrl}
                            alt="Creator media"
                            className={cn(
                              'h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]',
                              isLocked && 'opacity-60'
                            )}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,hsl(var(--surface-container)),hsl(var(--surface-container-highest)))] dark:bg-[linear-gradient(135deg,#1b1f28,#0b0d12)]">
                            <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
                              image
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
                          <span className="material-symbols-outlined text-[14px]">
                            {entry.media.mediaType === 'video' ? 'videocam' : 'photo_library'}
                          </span>
                          {entry.media.mediaType === 'video' ? 'Video' : 'Photo'}
                        </div>

                        {isLocked ? (
                          <div className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                            {entry.post.accessLevel === 'ppv'
                              ? formatPriceUnknown(entry.post.ppvPrice)
                              : 'Subscribe'}
                          </div>
                        ) : null}

                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <p className="line-clamp-2 text-sm font-medium text-white">
                            {entry.post.content || `${creator.displayName} media drop`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Card className="border border-border bg-surface-container-lowest text-on-surface">
                  <CardContent className="py-16 text-center">
                    <p className="text-base font-medium text-on-surface">No media uploaded yet</p>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      New photos and videos will appear here as soon as they&apos;re published.
                    </p>
                  </CardContent>
                </Card>
              )
            ) : posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    showCreator={false}
                    variant="profile"
                    onLike={() => handleLike(post.id)}
                    onBookmark={() => handleBookmark(post.id)}
                    onUnlock={() => void handleUnlock(post.id)}
                    onSubscribe={handleSubscribeClick}
                  />
                ))}

                {hasMore && nextCursor ? (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      className="rounded-full border-outline-variant bg-surface-container-lowest px-6 text-primary hover:bg-primary/10"
                      onClick={() => void fetchPosts(nextCursor)}
                    >
                      Load More
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Card className="border border-border bg-surface-container-lowest text-on-surface">
                <CardContent className="py-16 text-center">
                  <p className="text-base font-medium text-on-surface">
                    {creator.isSubscribed
                      ? `${creator.displayName} hasn't posted yet`
                      : `Subscribe to unlock ${creator.displayName}'s full feed`}
                  </p>
                  {!creator.isSubscribed ? (
                    <Button
                      className="mt-5 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                      onClick={handleSubscribeClick}
                    >
                      Subscribe for {formatCurrency(creator.subscriptionPrice)}/mo
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <aside className="hidden w-[360px] shrink-0 xl:block">
          <div className="sticky top-0 px-8 py-6">
            <CreatorSidebarCard
              creator={creator}
              plans={plans}
              bundles={bundles}
              onSubscribeClick={handleSubscribeClick}
              onBundlePurchase={handleBundlePurchase}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </aside>
      </div>

      <Dialog
        open={selectedMedia !== null}
        onOpenChange={(open) => !open && setSelectedMediaIndex(null)}
      >
        <DialogContent className="w-[min(96vw,920px)] max-w-none border-border bg-surface-container-lowest p-0 text-on-surface">
          <DialogTitle className="sr-only">
            {selectedMedia ? `${creator.displayName} media preview` : 'Creator media preview'}
          </DialogTitle>

          {selectedMedia ? (
            <div className="overflow-hidden rounded-[28px]">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {creator.displayName}
                  </p>
                  <p className="truncate text-xs text-on-surface-variant">
                    @{creator.handle} • {selectedMedia.post.accessLevel}
                  </p>
                </div>
                <DialogClose className="rounded-full border border-border p-2 text-on-surface-variant transition hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </DialogClose>
              </div>

              <div className="px-4 py-4 sm:px-5">
                <div className="overflow-hidden rounded-[24px] border border-border bg-black">
                  <MediaRenderer
                    media={[selectedMedia.media]}
                    variant="detail"
                    isLocked={
                      !selectedMedia.post.hasAccess && selectedMedia.post.accessLevel !== 'free'
                    }
                    accessLevel={selectedMedia.post.accessLevel}
                    ppvPrice={selectedMedia.post.ppvPrice}
                    onSubscribe={handleSubscribeClick}
                    onUnlock={() => void handleUnlock(selectedMedia.post.id)}
                    previewConfig={selectedMedia.post.previewConfig}
                    overlays={selectedMedia.post.overlays}
                  />
                </div>

                <div className="space-y-4 px-1 py-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                    <span className="rounded-full border border-border bg-surface-container-low px-3 py-1">
                      {selectedMedia.media.mediaType}
                    </span>
                    <span className="rounded-full border border-border bg-surface-container-low px-3 py-1">
                      {selectedMedia.post.viewCount.toLocaleString()} views
                    </span>
                    {selectedMedia.post.accessLevel !== 'free' ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                        {selectedMedia.post.accessLevel === 'ppv'
                          ? `Unlock ${formatPriceUnknown(selectedMedia.post.ppvPrice)}`
                          : 'Subscriber-only'}
                      </span>
                    ) : null}
                  </div>

                  {selectedMedia.post.content ? (
                    <p className="whitespace-pre-wrap text-sm leading-6 text-on-surface">
                      {selectedMedia.post.content}
                    </p>
                  ) : null}

                  {!selectedMedia.post.hasAccess && selectedMedia.post.accessLevel !== 'free' ? (
                    <div className="flex flex-wrap gap-3">
                      {selectedMedia.post.accessLevel === 'ppv' ? (
                        <Button
                          className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                          onClick={() => void handleUnlock(selectedMedia.post.id)}
                        >
                          Unlock {formatPriceUnknown(selectedMedia.post.ppvPrice)}
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        className="rounded-full border-outline-variant bg-surface-container-lowest px-5 text-primary hover:bg-primary/10"
                        onClick={handleSubscribeClick}
                      >
                        Subscribe to unlock
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {creator && plans.length > 0 ? (
        <SubscribeModal
          isOpen={showSubscribeModal}
          onClose={() => setShowSubscribeModal(false)}
          creator={{
            id: creator.id,
            displayName: creator.displayName,
            avatarUrl: creator.avatarUrl,
          }}
          plans={plans}
          onSubscribe={handleSubscribe}
        />
      ) : null}
    </div>
  );
}
