'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CreatorCTA } from '@/components/creator/CreatorCTA';
import { ExploreRailContent } from '@/components/explore/ExploreRailExtras';
import { AppRailLayout } from '@/components/layout/AppRailLayout';
import { PostCard } from '@/components/posts/PostCard';
import { useAuthPrompt } from '@/components/providers/AuthPromptProvider';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

export function PublicFeed() {
  const { isAuthenticated, requireAuth } = useAuthPrompt();
  const [posts, setPosts] = useState<PostWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicFeed = async () => {
      try {
        const data = await apiClient.explore.getFeed();
        setPosts(data.posts);
      } catch (error) {
        console.error('Failed to fetch public feed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPublicFeed();
  }, []);

  const handleInteraction = (action: string) => {
    requireAuth(action);
  };

  return (
    <AppRailLayout
      centerMaxWidthClassName="max-w-[725px]"
      rail={<ExploreRailContent showLiveTeaser={false} />}
    >
      <div className="space-y-6 px-4 py-4 md:px-5">
        {/* Hero / CTA Section */}
        {!isAuthenticated && (
          <div className="rounded-[24px] bg-surface-container-low p-6 text-center shadow-card">
            <h2 className="mb-2 font-headline text-2xl font-black text-on-surface">
              Welcome to NuttyFans
            </h2>
            <p className="mb-4 text-sm text-on-surface-variant">
              Connect with your favorite creators and access exclusive content
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/register">Join Now</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/creator/start">Become a Creator</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Creator CTA for logged-in users */}
        {isAuthenticated && (
          <div className="flex flex-col items-stretch justify-between gap-4 rounded-[16px] border border-surface-container-high bg-surface-container-low p-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-headline font-semibold text-on-surface">
                Ready to share your content?
              </h3>
              <p className="text-sm text-on-surface-variant">Start earning from your passion</p>
            </div>
            <CreatorCTA variant="compact" />
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          <h3 className="font-headline text-lg font-bold">Discover Creators</h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
                progress_activity
              </span>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post, index) => (
              <div key={post.id} className="space-y-6">
                <PostCard
                  post={post}
                  onLike={() => handleInteraction('like this post')}
                  onBookmark={() => handleInteraction('bookmark this post')}
                />
                {index === 3 ? (
                  <div className="xl:hidden">
                    <ExploreRailContent showLiveTeaser={false} />
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-on-surface-variant">
              <p>No public posts available right now.</p>
            </div>
          )}
          {posts.length > 0 && posts.length < 4 ? (
            <div className="xl:hidden">
              <ExploreRailContent showLiveTeaser={false} />
            </div>
          ) : null}
        </div>
      </div>
    </AppRailLayout>
  );
}
