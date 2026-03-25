'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAuthPrompt } from '@/components/providers/AuthPromptProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { request } from '@/services/apiClient';
import type { CommentWithUser, PaginatedComments, CreateCommentInput } from '@/types/content';

interface CommentsTrayProps {
  postId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isLocked?: boolean;
  commentsEnabled?: boolean;
}

export function CommentsTray({
  postId,
  isOpen,
  onOpenChange,
  isLocked = false,
  commentsEnabled = true,
}: CommentsTrayProps) {
  const { toast } = useToast();
  const { requireAuth, isAuthenticated } = useAuthPrompt();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onOpenChange]);

  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const [likesInFlight, setLikesInFlight] = useState<Set<string>>(() => new Set());

  const canWrite = useMemo(() => {
    return commentsEnabled && !isLocked;
  }, [commentsEnabled, isLocked]);

  const fetchComments = async (cursor?: string) => {
    setIsLoading(true);
    try {
      const sp = new URLSearchParams();
      if (cursor) sp.append('cursor', cursor);
      sp.append('limit', '20');
      const data = await request<PaginatedComments>(
        `/api/posts/${postId}/comments${sp.toString() ? `?${sp.toString()}` : ''}`
      );

      setComments((prev) => (cursor ? [...prev, ...data.comments] : data.comments));
      setNextCursor(data.nextCursor ?? null);
      setHasMore(data.hasMore ?? false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load comments';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load/reset when the tray opens.
  useEffect(() => {
    if (!isOpen) return;
    setComments([]);
    setNextCursor(null);
    setHasMore(false);
    setDraft('');
    setReplyingTo(null);
    void fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId]);

  const onSubmit = async () => {
    const content = draft.trim();
    if (!content) return;
    if (!canWrite) return;

    const action = replyingTo ? 'reply to this post' : 'comment on this post';
    const ok = requireAuth(action);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      const input: CreateCommentInput = {
        content,
        parentId: replyingTo ?? undefined,
      };

      await request(`/api/posts/${postId}/comments`, {
        method: 'POST',
        data: input,
      });

      // Simplest/most reliable: refresh first page so counters & ordering are correct.
      setDraft('');
      setReplyingTo(null);
      await fetchComments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create comment';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    if (likesInFlight.has(commentId)) return;

    const ok = requireAuth('like a comment');
    if (!ok) return;

    setLikesInFlight((prev) => new Set(prev).add(commentId));
    try {
      const res = await request<{ isLiked: boolean }>(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      const isLiked = res.isLiked;
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              isLiked,
              likeCount: c.likeCount + (isLiked ? 1 : -1),
            };
          }

          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r.id !== commentId) return r;
                return {
                  ...r,
                  isLiked,
                  likeCount: r.likeCount + (isLiked ? 1 : -1),
                };
              }),
            };
          }

          return c;
        })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to like comment';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLikesInFlight((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed bottom-16 left-0 right-0 z-50',
        'md:bottom-0',
        'max-w-none rounded-t-2xl border-surface-container-high bg-background shadow-lg',
        'pointer-events-auto'
      )}
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-surface-container-high/80 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => onOpenChange(false)}
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Button>
            <h3 className="truncate text-sm font-semibold">Comments</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => onOpenChange(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!commentsEnabled ? (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              Comments are disabled for this post.
            </div>
          ) : isLocked ? (
            <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
              Unlock access to comment on this post.
            </div>
          ) : null}

          {/* List */}
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className="space-y-2 rounded-xl border border-surface-container-high/70 bg-surface-container-low p-3"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={c.user.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>{c.user.displayName[0] ?? 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{c.user.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface">{c.content}</p>

                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => void toggleLike(c.id)}
                        disabled={!isAuthenticated || likesInFlight.has(c.id)}
                        className="inline-flex items-center gap-1 hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {c.isLiked ? 'favorite' : 'favorite_border'}
                        </span>
                        {c.likeCount}
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplyingTo(c.id)}
                        disabled={!canWrite}
                        className="inline-flex items-center gap-1 hover:text-on-surface disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[18px]">reply</span>
                        Reply{c.replyCount ? ` (${c.replyCount})` : ''}
                      </button>
                    </div>

                    {replyingTo === c.id ? (
                      <div className="mt-2">
                        <Textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Write a reply..."
                          rows={2}
                          className="resize-none"
                          disabled={!canWrite}
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setDraft('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void onSubmit()}
                            disabled={isSubmitting || !canWrite}
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {c.replies && c.replies.length > 0 ? (
                      <div className="mt-3 space-y-2 rounded-lg border border-surface-container-high/70 bg-background p-2">
                        {c.replies.map((r) => (
                          <div key={r.id} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={r.user.avatarUrl ?? undefined} alt="" />
                              <AvatarFallback>{r.user.displayName[0] ?? 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-xs font-semibold">
                                  {r.user.displayName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(r.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-0.5 whitespace-pre-wrap text-sm text-on-surface">
                                {r.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && comments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Loading comments...</div>
            ) : null}

            {hasMore && !isLoading ? (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => void fetchComments(nextCursor ?? undefined)}
                  disabled={!nextCursor}
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-surface-container-high/80 bg-background/90 px-4 py-3 backdrop-blur-md">
          {!commentsEnabled ? (
            <div className="text-sm text-muted-foreground">Comments are disabled.</div>
          ) : isLocked ? (
            <div className="text-sm text-muted-foreground">Unlock access to comment.</div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="resize-none"
                disabled={!canWrite}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {replyingTo ? 'Replying...' : 'Posting...'}
                </div>
                <Button
                  type="button"
                  onClick={() => void onSubmit()}
                  disabled={isSubmitting || !draft.trim() || !canWrite}
                >
                  {replyingTo ? 'Reply' : 'Comment'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
