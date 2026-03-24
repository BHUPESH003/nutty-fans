'use client';

import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useCallback } from 'react';

import { MediaRenderer } from '@/components/media/MediaRenderer';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { PostInteractions } from '@/components/posts/PostInteractions';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { apiClient } from '@/services/apiClient';
import type { MediaItem, PostWithCreator } from '@/types/content';

interface PostCardProps {
  post: PostWithCreator;
  showCreator?: boolean;
  variant?: 'feed' | 'profile' | 'detail';
  onLike?: () => void;
  onBookmark?: () => void;
  onTip?: () => void;
  onUnlock?: () => void | Promise<void>;
  onSubscribe?: () => void | Promise<void>;
}

export function PostCard({
  post,
  showCreator = true,
  variant = 'feed',
  onLike,
  onBookmark,
  onTip,
  onUnlock,
  onSubscribe,
}: PostCardProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [hasAccess, setHasAccess] = useState(post.hasAccess ?? true);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isLocked = !hasAccess && post.accessLevel !== 'free';
  const primaryMedia = post.media[0];
  const isPrimaryImage = primaryMedia?.mediaType === 'image';
  const isPrimaryVideo = primaryMedia?.mediaType === 'video';
  const modalMediaUrl = getMediaUrl(primaryMedia);

  const handleUnlock = useCallback(async () => {
    if (!post.ppvPrice || post.accessLevel !== 'ppv') return;

    setIsUnlocking(true);
    try {
      if (onUnlock) {
        await onUnlock();
      } else {
        await apiClient.payments.unlockPpv(post.id);
      }
      // Only set access if no error was thrown
      setHasAccess(true);
    } catch (error: unknown) {
      console.error('[PostCard] Failed to unlock post:', error);

      // Revert optimistic update on error
      setHasAccess(false);

      // Note: Toast and low balance modal are now handled at API client level
      // The API client interceptor will show the toast and trigger the modal
    } finally {
      setIsUnlocking(false);
    }
  }, [onUnlock, post.id, post.ppvPrice, post.accessLevel]);

  return (
    <article className="group relative mb-6 overflow-hidden rounded-[12px] border border-surface-container-high bg-surface-container-lowest shadow-card">
      {/* Creator Header - Compact, above media */}
      {showCreator && (
        <div className="flex items-center gap-3 p-4">
          <Link href={`/c/${post.creator.handle}`} className="relative z-10 flex-shrink-0">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-surface-container-high">
              {post.creator.avatarUrl ? (
                <Image
                  src={post.creator.avatarUrl}
                  alt={post.creator.displayName}
                  className="object-cover"
                  fill
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-container text-sm font-semibold text-white">
                  {post.creator.displayName[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/c/${post.creator.handle}`}
                className="truncate font-headline text-sm font-bold text-on-surface hover:text-primary"
              >
                {post.creator.displayName}
              </Link>
              {post.creator.isVerified && (
                <span className="material-symbols-outlined flex-shrink-0 text-base text-secondary">
                  verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
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
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                  : 'border-primary/20 bg-primary/10 text-primary'
              }
            >
              {post.accessLevel === 'ppv' ? `$${post.ppvPrice}` : '🔒'}
            </Badge>
          )}
        </div>
      )}

      {/* Media - Full width, drives layout */}
      {post.media.length > 0 && (
        <div className="relative">
          <div
            role={isLocked ? undefined : 'button'}
            tabIndex={isLocked ? -1 : 0}
            className="block w-full text-left"
            onClick={() => {
              if (isLocked) return;
              setZoomLevel(1);
              setIsMediaModalOpen(true);
            }}
            onKeyDown={(event) => {
              if (isLocked) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setZoomLevel(1);
                setIsMediaModalOpen(true);
              }
            }}
            aria-label="Open media viewer"
          >
            <MediaRenderer
              media={post.media}
              variant={variant}
              isLocked={isLocked}
              accessLevel={post.accessLevel}
              ppvPrice={post.ppvPrice}
              onUnlock={handleUnlock}
              onSubscribe={onSubscribe}
              isUnlocking={isUnlocking}
            />
          </div>
          {!isLocked ? (
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setIsMediaModalOpen(true);
              }}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/75"
              aria-label="Open media in viewer"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
            </button>
          ) : null}
        </div>
      )}

      {/* Interaction Bar */}
      <div className="p-3">
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
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
            {post.content}
          </p>
        </div>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-4 pb-4 pt-0">
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 10).map((t) => (
              <Badge key={t.id} variant="secondary" className="text-xs">
                #{t.slug}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* View Stats */}
      <div className="px-4 pb-3 pt-0">
        <span className="text-xs text-on-surface-variant">
          {post.viewCount.toLocaleString()} views
        </span>
      </div>

      <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
        <DialogContent className="w-[min(96vw,780px)] max-w-none border-surface-container-high bg-background p-3 md:p-4">
          <DialogTitle className="sr-only">{post.creator.displayName} media viewer</DialogTitle>
          <div className="flex items-center justify-between border-b border-surface-container-high/70 pb-2">
            <p className="truncate text-sm font-semibold text-on-surface">
              {post.creator.displayName}
            </p>
            <div className="flex items-center gap-2">
              {isPrimaryImage ? (
                <>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.25))}
                    className="rounded-full border border-surface-container-high px-2 py-1 text-xs"
                    aria-label="Zoom out"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xs text-on-surface-variant">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
                    className="rounded-full border border-surface-container-high px-2 py-1 text-xs"
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                </>
              ) : null}
              <DialogClose className="rounded-full border border-surface-container-high p-1.5 text-on-surface-variant hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </DialogClose>
            </div>
          </div>

          <div className="mt-3 flex max-h-[78vh] min-h-[320px] items-center justify-center overflow-auto rounded-xl bg-black/90 p-2">
            {isPrimaryImage && modalMediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={modalMediaUrl}
                alt="Post media preview"
                className="max-h-[72vh] w-auto max-w-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            ) : null}
            {isPrimaryVideo && primaryMedia ? (
              <div className="w-full max-w-full overflow-hidden rounded-md">
                <VideoPlayer
                  videoId={primaryMedia.id}
                  poster={primaryMedia.thumbnailUrl || undefined}
                  duration={primaryMedia.duration}
                  variant="detail"
                  autoplay={false}
                  muted={false}
                  loop={false}
                />
              </div>
            ) : null}
            {!isPrimaryVideo && !modalMediaUrl ? (
              <div className="text-sm text-white/80">Media unavailable for viewer.</div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function getMediaUrl(media?: MediaItem) {
  if (!media) return null;
  const processed = media.processedUrl;
  const original = media.originalUrl;
  if (processed && processed !== 'locked') return processed;
  if (original && original !== 'locked') return original;
  return null;
}
