'use client';

import Link from 'next/link';

import { useAuthPrompt } from '@/components/providers/AuthPromptProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Mock data for demo - in production, this would come from an API
const mockPosts = [
  {
    id: '1',
    creator: {
      handle: 'sarah_creates',
      displayName: 'Sarah Creates',
      avatarUrl: null,
      isVerified: true,
    },
    preview: 'Just posted some new content! Check out my latest work...',
    likesCount: 234,
    commentsCount: 45,
    isPublic: true,
  },
  {
    id: '2',
    creator: {
      handle: 'mike_fitness',
      displayName: 'Mike Fitness',
      avatarUrl: null,
      isVerified: true,
    },
    preview: 'New workout routine dropping this week! Get ready for gains...',
    likesCount: 512,
    commentsCount: 89,
    isPublic: true,
  },
  {
    id: '3',
    creator: {
      handle: 'chef_anna',
      displayName: 'Chef Anna',
      avatarUrl: null,
      isVerified: false,
    },
    preview: 'Secret recipe revealed! My famous chocolate cake that everyone asks about...',
    likesCount: 1023,
    commentsCount: 156,
    isPublic: true,
  },
];

interface PostCardProps {
  post: (typeof mockPosts)[0];
}

function PostCard({ post }: PostCardProps) {
  const { requireAuth, isAuthenticated } = useAuthPrompt();

  const handleLike = () => {
    if (requireAuth('like this post')) {
      // User is authenticated, handle like
      console.warn('[Demo] Liking post:', post.id);
    }
  };

  const handleComment = () => {
    if (requireAuth('comment on posts')) {
      // User is authenticated, handle comment
      console.warn('[Demo] Commenting on post:', post.id);
    }
  };

  const handleSubscribe = () => {
    if (requireAuth('subscribe to creators')) {
      // User is authenticated, handle subscribe
      console.warn('[Demo] Subscribing to:', post.creator.handle);
    }
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        {/* Creator Header */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/c/${post.creator.handle}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <Avatar>
              <AvatarImage src={post.creator.avatarUrl ?? undefined} />
              <AvatarFallback>{post.creator.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{post.creator.displayName}</span>
                {post.creator.isVerified && <span className="text-primary">✓</span>}
              </div>
              <span className="text-sm text-muted-foreground">@{post.creator.handle}</span>
            </div>
          </Link>
          <Button size="sm" onClick={handleSubscribe}>
            Subscribe
          </Button>
        </div>

        {/* Post Content Preview */}
        <p className="mb-4 text-sm">{post.preview}</p>

        {/* Post Actions */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 transition-colors hover:text-primary"
          >
            <span>❤️</span>
            <span className="text-sm">{post.likesCount}</span>
          </button>
          <button
            onClick={handleComment}
            className="flex items-center gap-1 transition-colors hover:text-primary"
          >
            <span>💬</span>
            <span className="text-sm">{post.commentsCount}</span>
          </button>
          {!isAuthenticated && <span className="ml-auto text-xs">Sign in to interact</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function PublicFeed() {
  const { isAuthenticated } = useAuthPrompt();

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
        {mockPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More */}
      <div className="pt-4 text-center">
        <Button variant="outline">Load More</Button>
      </div>
    </div>
  );
}
