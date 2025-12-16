'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { PostWithCreator, CommentWithUser } from '@/types/content';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const postId = params['id'] as string;

  const [post, setPost] = React.useState<PostWithCreator | null>(null);
  const [comments, setComments] = React.useState<CommentWithUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (postId) {
      void fetchPost();
      void fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else if (res.status === 404) {
        router.push('/feed');
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleLike = async () => {
    if (!session?.user) {
      window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
      if (res.ok && post) {
        const { isLiked } = await res.json();
        setPost({
          ...post,
          isLiked,
          likeCount: post.likeCount + (isLiked ? 1 : -1),
        });
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleBookmark = async () => {
    if (!session?.user) {
      window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' });
      if (res.ok && post) {
        const { isBookmarked } = await res.json();
        setPost({ ...post, isBookmarked });
      }
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment('');
        if (post) {
          setPost({ ...post, commentCount: post.commentCount + 1 });
        }
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!session?.user) return;

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      if (res.ok) {
        const { isLiked } = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId ? { ...c, isLiked, likeCount: c.likeCount + (isLiked ? 1 : -1) } : c
          )
        );
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="mb-4 h-6 w-1/3 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">Post not found</h1>
        <Button asChild>
          <Link href="/feed">Back to Feed</Link>
        </Button>
      </div>
    );
  }

  const isLocked = !post.hasAccess && post.accessLevel !== 'free';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Post */}
      <Card>
        {/* Creator Header */}
        <div className="flex items-center gap-3 border-b p-4">
          <Link href={`/c/${post.creator.handle}`}>
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              {post.creator.avatarUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.creator.avatarUrl}
                    alt={post.creator.displayName}
                    className="h-full w-full object-cover"
                  />
                </>
              ) : (
                <span className="text-xl font-semibold text-primary">
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
          {post.isNsfw && <Badge variant="destructive">NSFW</Badge>}
        </div>

        {/* Content */}
        {post.content && (
          <CardContent className="pt-4">
            <p className="whitespace-pre-wrap text-lg">{post.content}</p>
          </CardContent>
        )}

        {/* Media */}
        {post.media.length > 0 && (
          <div className="relative">
            {isLocked ? (
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <div className="p-8 text-center">
                  <div className="mb-4 text-6xl">🔒</div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {post.accessLevel === 'ppv'
                      ? `Unlock for $${post.ppvPrice}`
                      : 'Subscribers Only'}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    {post.accessLevel === 'ppv'
                      ? 'Purchase to view this content'
                      : 'Subscribe to this creator to view'}
                  </p>
                  <Button size="lg">
                    {post.accessLevel === 'ppv' ? 'Purchase Now' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {post.media.map((media) => (
                  <div key={media.id}>
                    {media.mediaType === 'video' ? (
                      <video
                        src={media.processedUrl || media.originalUrl}
                        poster={media.thumbnailUrl || undefined}
                        controls
                        className="w-full"
                      />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={media.processedUrl || media.originalUrl}
                          alt=""
                          className="w-full"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 border-t p-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
          >
            <span className="text-xl">{post.isLiked ? '❤️' : '🤍'}</span>
            <span className="font-medium">{post.likeCount}</span>
          </button>

          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xl">💬</span>
            <span className="font-medium">{post.commentCount}</span>
          </div>

          <button
            onClick={handleBookmark}
            className={`flex items-center gap-2 transition-colors ${post.isBookmarked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            <span className="text-xl">{post.isBookmarked ? '🔖' : '📑'}</span>
          </button>

          <span className="ml-auto text-muted-foreground">{post.viewCount} views</span>
        </div>
      </Card>

      {/* Comments */}
      {post.commentsEnabled && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Comments ({post.commentCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* New Comment Form */}
            {session?.user ? (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <Button type="submit" disabled={submitting || !newComment.trim()}>
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="mb-6 rounded-lg bg-muted p-4 text-center">
                <p className="mb-2 text-muted-foreground">Sign in to leave a comment</p>
                <Button asChild size="sm">
                  <Link href={`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`}>
                    Sign In
                  </Link>
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No comments yet. Be the first!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      {comment.user.avatarUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={comment.user.avatarUrl}
                            alt=""
                            className="h-full w-full rounded-full object-cover"
                          />
                        </>
                      ) : (
                        <span className="text-sm font-semibold">{comment.user.displayName[0]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{comment.user.displayName}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1">{comment.content}</p>
                      <div className="mt-2 flex items-center gap-4">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1 text-sm ${comment.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                        >
                          <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                          <span>{comment.likeCount}</span>
                        </button>
                        {comment.replyCount > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {comment.replyCount} replies
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
