'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { PostForm } from '@/components/posts/PostForm';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';
import type { CreatePostInput } from '@/types/content';

export function NewPostContainer() {
  const router = useRouter();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleUploadFiles = React.useCallback(async (files: File[]) => {
    const mediaIds: string[] = [];

    for (const file of files) {
      // Request upload URL from our backend (must go through apiClient)
      const { uploadUrl, mediaId, key } = await apiClient.content.getUploadUrl(
        file.name,
        file.type,
        file.size
      );

      // Upload directly to S3 (external URL; not a NuttyFans API call)
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Upload failed');
      }

      // Confirm upload with backend
      await apiClient.content.confirmUpload(mediaId, key);

      mediaIds.push(mediaId);
    }

    return mediaIds;
  }, []);

  const handleSubmit = React.useCallback(
    async (data: CreatePostInput) => {
      setIsSubmitting(true);
      try {
        await apiClient.content.createPost(data);
        router.push('/creator/posts');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create post';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, toast]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Create New Post" subtitle="Share content with your subscribers" />
      <PostForm
        onSubmit={handleSubmit}
        onUploadFiles={handleUploadFiles}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
