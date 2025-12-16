'use client';

import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Creator Header */}
      {showCreator && (
        <div className="flex items-center gap-3 border-b p-4">
          <Link href={`/c/${post.creator.handle}`}>
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              {post.creator.avatarUrl ? (
                <Image
                  src={post.creator.avatarUrl}
                  alt={post.creator.displayName}
                  className="object-cover"
                  fill
                />
              ) : (
                <span className="text-lg font-semibold text-primary">
                  {post.creator.displayName[0]}
                </span>
              )}
            </div>
          </Link>
          <div className="flex-1">
            <Link
              href={`/c/${post.creator.handle}`}
              className="font-semibold transition-colors hover:text-primary"
            >
              {post.creator.displayName}
            </Link>
            <p className="text-sm text-muted-foreground">
              @{post.creator.handle} ·{' '}
              {formatDistanceToNow(new Date(post.publishedAt || post.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          {post.creator.isVerified && (
            <Badge variant="secondary" className="ml-auto">
              ✓ Verified
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      {post.content && (
        <CardContent className="pt-4">
          <p className="whitespace-pre-wrap">{post.content}</p>
        </CardContent>
      )}

      {/* Media Preview */}
      {primaryMedia && (
        <div className="relative">
          {isLocked ? (
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="p-6 text-center">
                <div className="mb-2 text-4xl">🔒</div>
                <p className="font-semibold">
                  {post.accessLevel === 'ppv' ? `Unlock for $${post.ppvPrice}` : 'Subscribers Only'}
                </p>
                <Button className="mt-3" size="sm">
                  {post.accessLevel === 'ppv' ? 'Purchase' : 'Subscribe'}
                </Button>
              </div>
            </div>
          ) : primaryMedia.mediaType === 'video' ? (
            <div className="aspect-video bg-black">
              <video
                src={primaryMedia.processedUrl || primaryMedia.originalUrl}
                poster={primaryMedia.thumbnailUrl || undefined}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="relative aspect-video w-full">
              <Image
                src={primaryMedia.processedUrl || primaryMedia.originalUrl}
                alt="Post media"
                className="object-cover"
                fill
              />
              {hasMultipleMedia && (
                <Badge className="absolute right-2 top-2">+{post.media.length - 1}</Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats & Actions */}
      <div className="flex items-center gap-6 border-t p-4">
        <button
          onClick={() => onLike?.(post.id)}
          className={`flex items-center gap-1.5 transition-colors ${post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
        >
          <span className="text-lg">{post.isLiked ? '❤️' : '🤍'}</span>
          <span className="text-sm font-medium">{post.likeCount}</span>
        </button>

        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <span className="text-lg">💬</span>
          <span className="text-sm font-medium">{post.commentCount}</span>
        </Link>

        <button
          onClick={() => onBookmark?.(post.id)}
          className={`flex items-center gap-1.5 transition-colors ${post.isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
        >
          <span className="text-lg">{post.isBookmarked ? '🔖' : '📑'}</span>
        </button>

        <span className="ml-auto text-sm text-muted-foreground">{post.viewCount} views</span>
      </div>
    </Card>
  );
}
