'use client';

import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { PostCard } from '@/components/posts/PostCard';
import { apiClient } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

export const PostDetailContainer = () => {
  const params = useParams();
  const id = params?.['id'] as string;
  const [post, setPost] = useState<PostWithCreator | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const data = await apiClient.content.getPost(id);
        setPost(data);
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPost();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Post not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PostCard post={post} />

      {/* Comments section placeholder */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">Comments</h3>
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          Comments coming soon...
        </div>
      </div>
    </div>
  );
};
