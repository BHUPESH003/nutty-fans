'use client';

import { useState, useEffect, useCallback } from 'react';

import { SubscribeModal } from '@/components/payments/SubscribeModal';
import { TipButton } from '@/components/payments/TipButton';
import { PostCard } from '@/components/posts/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient, request } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

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
  planType: string;
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

interface CreatorProfileContainerProps {
  handle: string;
}

export function CreatorProfileContainer({ handle }: CreatorProfileContainerProps) {
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [posts, setPosts] = useState<PostWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [bundles, setBundles] = useState<PublicBundle[]>([]);

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
    const loadData = async () => {
      setIsLoading(true);
      await fetchCreatorProfile();
      setIsLoading(false);
    };
    void loadData();
  }, [fetchCreatorProfile]);

  useEffect(() => {
    if (creator) {
      void fetchPlans(creator.id);
      void fetchPosts();
      void fetchBundles();
    }
  }, [creator, fetchPlans, fetchPosts, fetchBundles]);

  const handleSubscribeClick = () => {
    if (creator && !creator.isSubscribed) {
      setShowSubscribeModal(true);
    }
  };

  const handleSubscribe = useCallback(
    async (planType: string, _paymentSource: 'wallet' | 'card') => {
      if (!creator) return;

      setIsSubscribing(true);
      try {
        await apiClient.subscriptions.subscribe(
          creator.id,
          planType as 'monthly' | '3month' | '6month' | '12month'
        );
        setShowSubscribeModal(false);
        // Refresh creator profile to update subscription status
        await fetchCreatorProfile();
        // Refresh posts to show subscriber content
        await fetchPosts();
      } catch (error) {
        console.error('Failed to subscribe:', error);
        throw error; // Let SubscribeModal handle the error display
      } finally {
        setIsSubscribing(false);
      }
    },
    [creator, fetchCreatorProfile, fetchPosts]
  );

  const handleLike = useCallback(async (postId: string) => {
    try {
      await apiClient.content.toggleLike(postId);
      // Update local state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  }, []);

  const handleBookmark = useCallback(async (postId: string) => {
    try {
      await apiClient.content.toggleBookmark(postId);
      // Update local state
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              isBookmarked: !post.isBookmarked,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  }, []);

  const handleUnlock = useCallback(
    async (postId: string) => {
      try {
        await apiClient.payments.unlockPpv(postId);
        // Refresh posts to show unlocked content
        await fetchPosts();
      } catch (error) {
        console.error('Failed to unlock post:', error);
      }
    },
    [fetchPosts]
  );

  const handleBundlePurchase = useCallback(
    async (bundleId: string) => {
      try {
        await apiClient.bundles.purchase(bundleId);
        await fetchBundles();
        await fetchPosts(); // update hasAccess for bundle-included posts
      } catch (error) {
        console.error('Failed to purchase bundle:', error);
      }
    },
    [fetchBundles, fetchPosts]
  );

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatPriceUnknown = (p: unknown) => {
    const n = typeof p === 'number' ? p : Number(p);
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
  };

  if (isLoading || !creator) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/40 md:h-64">
        {creator.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={creator.coverImageUrl} alt="Cover" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-4xl px-4">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-end">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={creator.avatarUrl ?? undefined} alt={creator.displayName} />
            <AvatarFallback className="text-4xl">
              {creator.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{creator.displayName}</h1>
              {creator.isVerified && <Badge variant="secondary">✓ Verified</Badge>}
            </div>
            <p className="text-muted-foreground">@{creator.handle}</p>
            {creator.category && (
              <Badge variant="outline" className="mt-2">
                {creator.category.name}
              </Badge>
            )}
          </div>

          <div className="flex gap-3">
            <TipButton
              creatorId={creator.id}
              creatorName={creator.displayName}
              size="lg"
              variant="outline"
            />
            <Button
              size="lg"
              onClick={handleSubscribeClick}
              disabled={creator.isSubscribed || isSubscribing}
            >
              {creator.isSubscribed
                ? 'Subscribed'
                : `Subscribe ${formatPrice(creator.subscriptionPrice)}/mo`}
            </Button>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="whitespace-pre-wrap">{creator.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{creator.subscriberCount}</p>
              <p className="text-muted-foreground">Subscribers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{creator.postCount}</p>
              <p className="text-muted-foreground">Posts</p>
            </CardContent>
          </Card>
        </div>

        {/* Bundles */}
        {bundles.length > 0 ? (
          <div className="mb-8 space-y-3">
            <div className="text-lg font-semibold">Bundles</div>
            <div className="grid gap-3 md:grid-cols-2">
              {bundles.map((b) => (
                <Card key={b.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{b.title}</div>
                        {b.description ? (
                          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {b.description}
                          </div>
                        ) : null}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatPriceUnknown(b.price)}</span>
                          {b.originalPrice ? (
                            <span className="line-through">
                              {formatPriceUnknown(b.originalPrice)}
                            </span>
                          ) : null}
                          <span>{b.itemCount} items</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant={b.isPurchased ? 'outline' : 'default'}
                          disabled={!!b.isPurchased}
                          onClick={() => void handleBundlePurchase(b.id)}
                        >
                          {b.isPurchased ? 'Owned' : 'Buy'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showCreator={false}
                variant="profile"
                onLike={() => handleLike(post.id)}
                onBookmark={() => handleBookmark(post.id)}
                onUnlock={() => handleUnlock(post.id)}
              />
            ))}
            {hasMore && nextCursor && (
              <div className="flex justify-center py-8">
                <Button variant="outline" onClick={() => fetchPosts(nextCursor)}>
                  Load More
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {creator.isSubscribed
                  ? `${creator.displayName} hasn't posted yet`
                  : `Subscribe to see ${creator.displayName}'s content`}
              </p>
              {!creator.isSubscribed && (
                <Button className="mt-4" onClick={handleSubscribeClick}>
                  Subscribe for {formatPrice(creator.subscriptionPrice)}/mo
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subscribe Modal */}
      {creator && plans.length > 0 && (
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
      )}
    </div>
  );
}
