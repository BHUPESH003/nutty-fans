'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { PostForm } from '@/components/posts/PostForm';
import type { CreatePostInput } from '@/types/content';

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: CreatePostInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Failed to create post');
      }

      router.push('/creator/posts');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Create New Post" subtitle="Share content with your subscribers" />
      <PostForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
