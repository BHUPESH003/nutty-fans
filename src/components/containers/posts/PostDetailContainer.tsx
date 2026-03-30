'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { CommentsTray } from '@/components/posts/CommentsTray';
import { PostCard } from '@/components/posts/PostCard';
import { apiClient } from '@/services/apiClient';
import type { PostWithCreator } from '@/types/content';

export const PostDetailContainer = () => {
  const params = useParams();
  const id = params?.['id'] as string;
  const [post, setPost] = useState<PostWithCreator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(true);

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
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
          progress_activity
        </span>
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
    <div className="mx-auto w-full max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
      <PostCard post={post} />

      {/* Instagram-style bottom comments tray */}
      <CommentsTray
        postId={post.id}
        isOpen={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        isLocked={!post.hasAccess && post.accessLevel !== 'free'}
        commentsEnabled={post.commentsEnabled}
      />
    </div>
  );
};
