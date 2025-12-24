'use client';

import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';

import { MediaRenderer } from '@/components/media/MediaRenderer';
import { PostInteractions } from '@/components/posts/PostInteractions';
import { Badge } from '@/components/ui/badge';
import type { PostWithCreator } from '@/types/content';

interface PostCardProps {
  post: PostWithCreator;
  showCreator?: boolean;
  variant?: 'feed' | 'profile' | 'detail';
  onLike?: () => void;
  onBookmark?: () => void;
  onTip?: () => void;
  onUnlock?: () => void;
}

export function PostCard({
  post,
  showCreator = true,
  variant = 'feed',
  onLike,
  onBookmark,
  onTip,
  onUnlock,
}: PostCardProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [hasAccess, setHasAccess] = useState(post.hasAccess ?? true);

  const isLocked = !hasAccess && post.accessLevel !== 'free';

  const handleUnlock = useCallback(async () => {
    setIsUnlocking(true);
    try {
      onUnlock?.();
      // The parent component should handle the actual unlock and trigger a refetch
      // which will update hasAccess through the post prop
      setHasAccess(true);
    } finally {
      setIsUnlocking(false);
    }
  }, [onUnlock]);

  return (
    <article className="group relative mb-6 overflow-hidden rounded-2xl bg-card/40 transition-all hover:bg-card/60">
      {/* Creator Header - Compact, above media */}
      {showCreator && (
        <div className="flex items-center gap-3 p-4 pb-3">
          <Link href={`/c/${post.creator.handle}`} className="relative z-10 flex-shrink-0">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-background/50">
              {post.creator.avatarUrl ? (
                <Image
                  src={post.creator.avatarUrl}
                  alt={post.creator.displayName}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-purple-600 text-sm font-semibold text-white">
                  {post.creator.displayName[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/c/${post.creator.handle}`}
                className="truncate font-semibold text-foreground hover:text-primary"
              >
                {post.creator.displayName}
              </Link>
              {post.creator.isVerified && (
                <Badge
                  variant="secondary"
                  className="flex-shrink-0 bg-blue-500/10 px-1.5 py-0 text-[10px] text-blue-400"
                >
                  ✓
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">@{post.creator.handle}</span>
              <span>•</span>
              <span className="flex-shrink-0">
                {formatDistanceToNow(new Date(post.publishedAt || post.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {/* Access Badge */}
          {post.accessLevel !== 'free' && (
            <Badge
              variant="outline"
              className={
                post.accessLevel === 'ppv'
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  : 'border-primary/30 bg-primary/10 text-primary'
              }
            >
              {post.accessLevel === 'ppv' ? `$${post.ppvPrice}` : '🔒'}
            </Badge>
          )}
        </div>
      )}

      {/* Media - Full width, drives layout */}
      {post.media.length > 0 && (
        <MediaRenderer
          media={post.media}
          variant={variant}
          isLocked={isLocked}
          accessLevel={post.accessLevel}
          ppvPrice={post.ppvPrice}
          onUnlock={handleUnlock}
          isUnlocking={isUnlocking}
        />
      )}

      {/* Interaction Bar */}
      <div className="p-4 pt-3">
        <PostInteractions
          postId={post.id}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          isLiked={post.isLiked}
          isBookmarked={post.isBookmarked}
          tipEnabled={true}
          variant="feed"
          onLike={onLike}
          onBookmark={onBookmark}
          onTip={onTip}
        />
      </div>

      {/* Caption - Below media and actions */}
      {post.content && (
        <div className="px-4 pb-4 pt-0">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {post.content}
          </p>
        </div>
      )}

      {/* View Stats */}
      <div className="border-t border-white/5 px-4 py-2.5">
        <span className="text-xs text-muted-foreground">
          {post.viewCount.toLocaleString()} views
        </span>
      </div>
    </article>
  );
}
