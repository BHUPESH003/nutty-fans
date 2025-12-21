'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

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
    <div className="space-y-6">
      {/* Hero / CTA Section */}
      {!isAuthenticated && (
        <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
          <h2 className="mb-2 text-2xl font-bold">Welcome to NuttyFans</h2>
          <p className="mb-4 text-muted-foreground">
            Connect with your favorite creators and access exclusive content
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/register">Join Now</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/creator/apply">Become a Creator</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Become a Creator CTA for logged-in users */}
      {isAuthenticated && (
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4">
          <div>
            <h3 className="font-semibold">Ready to share your content?</h3>
            <p className="text-sm text-muted-foreground">Start earning from your passion</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/creator/apply">Become a Creator</Link>
          </Button>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Discover Creators</h3>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => handleInteraction('like this post')}
              onBookmark={() => handleInteraction('bookmark this post')}
            />
          ))
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No public posts available right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
