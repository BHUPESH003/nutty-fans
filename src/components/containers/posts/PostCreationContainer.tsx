'use client';

import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';

export const PostCreationContainer = () => {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 20MB',
        });
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) return;

    setIsSubmitting(true);
    try {
      const mediaIds: string[] = [];

      // Upload media if selected
      if (selectedFile) {
        // 1. Get upload URL
        const { uploadUrl, mediaId, key } = await apiClient.content.getUploadUrl(
          selectedFile.name,
          selectedFile.type,
          selectedFile.size
        );

        // 2. Upload to S3
        await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: {
            'Content-Type': selectedFile.type,
          },
        });

        // 3. Confirm upload
        await apiClient.content.confirmUpload(mediaId, key);
        mediaIds.push(mediaId);
      }

      // 4. Create post
      await apiClient.content.createPost({
        content,
        mediaIds,
        postType: 'post',
        accessLevel: 'free', // Default to free for now
        status: 'published',
      });

      toast({
        title: 'Post created',
        description: 'Your post has been published successfully.',
      });

      // Reset form
      setContent('');
      removeFile();
      router.refresh(); // Refresh feed
    } catch (error: unknown) {
      console.error('Failed to create post:', error);
      const message = error instanceof Error ? error.message : 'Failed to create post';
      toast({
        title: 'Error',
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Create Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
        />

        {previewUrl && (
          <div className="relative overflow-hidden rounded-md border">
            <Image
              src={previewUrl}
              alt="Preview"
              width={500}
              height={300}
              className="max-h-[300px] w-full object-contain"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full"
              onClick={removeFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Add Image
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && !selectedFile)}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Post
        </Button>
      </CardFooter>
    </Card>
  );
};
