'use client';

import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { PostForm } from '@/components/posts/PostForm';
import { useToast } from '@/hooks/use-toast';
import { readMediaDimensionsFromFile } from '@/lib/media/readMediaDimensions';
import { apiClient } from '@/services/apiClient';
import type { CreatePostInput, PostWithCreator } from '@/types/content';

export function EditPostContainer() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const postId = params?.['id'] as string;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [existingPost, setExistingPost] = React.useState<PostWithCreator | null>(null);
  const [existingMediaIds, setExistingMediaIds] = React.useState<string[]>([]);

  // Fetch existing post data
  React.useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      try {
        const post = await apiClient.content.getPost(postId);
        setExistingPost(post);
        setExistingMediaIds(post.media.map((m: { id: string }) => m.id));
      } catch (error) {
        console.error('Failed to fetch post:', error);
        toast({
          title: 'Error',
          description: 'Failed to load post',
          variant: 'destructive',
        });
        router.push('/creator/posts');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPost();
  }, [postId, router, toast]);

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

      const dims = await readMediaDimensionsFromFile(file);
      await apiClient.content.confirmUpload(mediaId, key, dims);

      mediaIds.push(mediaId);
    }

    return mediaIds;
  }, []);

  const handleSubmit = React.useCallback(
    async (data: CreatePostInput) => {
      if (!postId) return;

      setIsSubmitting(true);
      try {
        // Merge existing media with newly uploaded media
        const allMediaIds = [...existingMediaIds, ...(data.mediaIds || [])];

        await apiClient.content.updatePost(postId, {
          ...data,
          mediaIds: allMediaIds,
        });

        toast({
          title: 'Success',
          description: 'Post updated successfully',
        });

        router.push('/creator/posts');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update post';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [postId, existingMediaIds, router, toast]
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  if (!existingPost) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Post not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit Post" subtitle="Update your content" />
      <PostForm
        onSubmit={handleSubmit}
        onUploadFiles={handleUploadFiles}
        onCancel={() => router.back()}
        isSubmitting={isSubmitting}
        initialData={{
          content: existingPost.content || '',
          postType: existingPost.postType,
          accessLevel: existingPost.accessLevel,
          ppvPrice: existingPost.ppvPrice || undefined,
          mediaIds: existingMediaIds,
        }}
      />
    </div>
  );
}
