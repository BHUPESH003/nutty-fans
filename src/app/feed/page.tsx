'use client';

import { useSession } from 'next-auth/react';
import * as React from 'react';

import { PostCard } from '@/components/posts/PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PostWithCreator } from '@/types/content';

export default function FeedPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = React.useState<PostWithCreator[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(false);

  React.useEffect(() => {
    if (status !== 'loading') {
      void fetchFeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchFeed = async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);

      // Use subscribed feed if logged in, otherwise explore
      const endpoint = session?.user ? '/api/feed' : '/api/feed/explore';
      const res = await fetch(`${endpoint}?${params.toString()}`);

      if (res.ok) {
        const data = await res.json();
        if (cursor) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!session?.user) {
      // Redirect to login
      window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (res.ok) {
        const { isLiked } = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isLiked, likeCount: p.likeCount + (isLiked ? 1 : -1) } : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!session?.user) {
      window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' });
      if (res.ok) {
        const { isBookmarked } = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isBookmarked } : p)));
      }
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="mb-4 h-4 w-1/3 rounded bg-muted" />
                <div className="h-24 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{session?.user ? 'Your Feed' : 'Explore'}</h1>

      {!session?.user && (
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">Get the full experience</h2>
            <p className="mb-4 text-muted-foreground">
              Sign up to follow your favorite creators and see their exclusive content
            </p>
            <div className="flex justify-center gap-3">
              <Button asChild>
                <a href="/register">Sign Up</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/login">Log In</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-4xl">📭</div>
            <h3 className="mb-2 font-semibold">
              {session?.user ? 'No posts yet' : 'Nothing to explore'}
            </h3>
            <p className="text-muted-foreground">
              {session?.user
                ? 'Subscribe to creators to see their posts here'
                : 'Creators are still getting started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} onBookmark={handleBookmark} />
          ))}

          {hasMore && (
            <div className="py-4 text-center">
              <Button
                variant="outline"
                onClick={() => nextCursor && fetchFeed(nextCursor)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
