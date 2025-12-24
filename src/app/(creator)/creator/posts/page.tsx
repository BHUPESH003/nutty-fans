'use client';

import { formatDistanceToNow } from 'date-fns';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PostWithCreator, PostStatus } from '@/types/content';

type TabType = 'all' | 'published' | 'draft' | 'scheduled';

export default function CreatorPostsPage() {
  const [posts, setPosts] = React.useState<PostWithCreator[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TabType>('all');

  React.useEffect(() => {
    void fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.set('status', activeTab);
      }

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (res.ok) {
        const response = await res.json();
        // API returns { data: { posts: [] } } structure
        setPosts(response.data?.posts || response.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/publish`, { method: 'POST' });
      if (res.ok) {
        void fetchPosts();
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        void fetchPosts();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    const variants: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'outline' }
    > = {
      published: { label: '✓ Published', variant: 'default' },
      draft: { label: 'Draft', variant: 'secondary' },
      scheduled: { label: '⏰ Scheduled', variant: 'outline' },
      archived: { label: 'Archived', variant: 'secondary' },
    };
    const { label, variant } = variants[status] || { label: status, variant: 'secondary' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getAccessBadge = (accessLevel: string) => {
    const labels: Record<string, string> = {
      free: '🌍 Free',
      subscribers: '⭐ Subscribers',
      ppv: '💰 PPV',
    };
    return <Badge variant="outline">{labels[accessLevel] || accessLevel}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Posts"
        subtitle="Manage your content"
        actions={
          <Button asChild>
            <Link href="/creator/posts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(['all', 'published', 'draft', 'scheduled'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-4xl">📝</div>
            <h3 className="mb-2 font-semibold">No posts yet</h3>
            <p className="mb-4 text-muted-foreground">Create your first post to start earning</p>
            <Button asChild>
              <Link href="/creator/posts/new">Create Post</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {post.media[0] && (
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {post.media[0].mediaType === 'video' ? (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                          <span className="text-2xl">🎬</span>
                        </div>
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={post.media[0].thumbnailUrl || post.media[0].originalUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-medium">
                        {post.content || (
                          <span className="text-muted-foreground">(No text content)</span>
                        )}
                      </p>
                      <div className="flex flex-shrink-0 gap-2">
                        {getStatusBadge(post.status)}
                        {getAccessBadge(post.accessLevel)}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>❤️ {post.likeCount}</span>
                      <span>💬 {post.commentCount}</span>
                      <span>👁️ {post.viewCount}</span>
                      <span>
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/creator/posts/${post.id}/edit`}>Edit</a>
                      </Button>
                      {post.status === 'draft' && (
                        <Button size="sm" onClick={() => handlePublish(post.id)}>
                          Publish
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(post.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
