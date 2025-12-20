'use client';

import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PostWithCreator } from '@/types/content';

interface PostCardProps {
  post: PostWithCreator;
  showCreator?: boolean;
  onLike?: (_postId: string) => void; // eslint-disable-line no-unused-vars
  onBookmark?: (_postId: string) => void; // eslint-disable-line no-unused-vars
}

export function PostCard({ post, showCreator = true, onLike, onBookmark }: PostCardProps) {
  const primaryMedia = post.media[0];
  const hasMultipleMedia = post.media.length > 1;
  const isLocked = !post.hasAccess && post.accessLevel !== 'free';

  return (
    <div className="group relative mb-8 overflow-hidden rounded-2xl bg-card/40 transition-all hover:bg-card/60">
      {/* Creator Header - Overlay on top of media if possible, or clean top bar */}
      {showCreator && (
        <div className="flex items-center gap-3 p-4">
          <Link href={`/c/${post.creator.handle}`} className="relative z-10">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-background/50">
              {post.creator.avatarUrl ? (
                <Image
                  src={post.creator.avatarUrl}
                  alt={post.creator.displayName}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-purple-600 text-white">
                  {post.creator.displayName[0]}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1">
            <Link
              href={`/c/${post.creator.handle}`}
              className="font-semibold text-foreground hover:text-primary"
            >
              {post.creator.displayName}
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>@{post.creator.handle}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.publishedAt || post.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          {post.creator.isVerified && (
            <Badge
              variant="secondary"
              className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
            >
              Verified
            </Badge>
          )}
        </div>
      )}

      {/* Content Text */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {post.content}
          </p>
        </div>
      )}

      {/* Media Preview */}
      {primaryMedia && (
        <div className="relative w-full overflow-hidden bg-black/20">
          {isLocked ? (
            <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-video">
              {/* Blurred Background Image */}
              <div className="absolute inset-0 scale-110 blur-2xl filter">
                <Image
                  src={primaryMedia.processedUrl || primaryMedia.originalUrl}
                  alt="Locked content"
                  className="object-cover opacity-50"
                  fill
                />
              </div>

              {/* Lock Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-6 text-center backdrop-blur-sm">
                <div className="mb-4 rounded-full bg-white/10 p-4 backdrop-blur-md">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  {post.accessLevel === 'ppv' ? 'Premium Content' : 'Subscribers Only'}
                </h3>
                <p className="mb-6 max-w-xs text-sm text-white/80">
                  {post.accessLevel === 'ppv'
                    ? `Unlock this post for $${post.ppvPrice}`
                    : 'Subscribe to view this exclusive content'}
                </p>
                <Button
                  size="lg"
                  className="w-full max-w-[200px] font-semibold shadow-xl shadow-primary/20"
                >
                  {post.accessLevel === 'ppv' ? `Unlock for $${post.ppvPrice}` : 'Subscribe Now'}
                </Button>
              </div>
            </div>
          ) : primaryMedia.mediaType === 'video' ? (
            <div className="aspect-[4/5] w-full bg-black sm:aspect-video">
              <video
                src={primaryMedia.processedUrl || primaryMedia.originalUrl}
                poster={primaryMedia.thumbnailUrl || undefined}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="relative aspect-[4/5] w-full sm:aspect-video">
              <Image
                src={primaryMedia.processedUrl || primaryMedia.originalUrl}
                alt="Post media"
                className="object-cover"
                fill
              />
              {hasMultipleMedia && (
                <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
                  +{post.media.length - 1}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats & Actions */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onLike?.(post.id)}
            className={`group flex items-center gap-2 transition-colors ${
              post.isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <span
              className={`text-xl transition-transform group-active:scale-75 ${post.isLiked ? 'scale-110' : ''}`}
            >
              {post.isLiked ? '❤️' : '🤍'}
            </span>
            <span className="text-sm font-medium">{post.likeCount}</span>
          </button>

          <Link
            href={`/post/${post.id}`}
            className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="text-xl">💬</span>
            <span className="text-sm font-medium">{post.commentCount}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">{post.viewCount} views</span>
          <button
            onClick={() => onBookmark?.(post.id)}
            className={`transition-colors ${
              post.isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="text-xl">{post.isBookmarked ? '🔖' : '📑'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
