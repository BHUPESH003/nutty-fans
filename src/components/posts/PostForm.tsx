'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreatePostInput } from '@/types/content';

interface PostFormProps {
  initialData?: Partial<CreatePostInput>;
  onSubmit: (_data: CreatePostInput) => Promise<void>; // eslint-disable-line no-unused-vars
  isSubmitting?: boolean;
}

export function PostForm({ initialData, onSubmit, isSubmitting }: PostFormProps) {
  const router = useRouter();
  const [content, setContent] = React.useState(initialData?.content || '');
  const [postType, setPostType] = React.useState<'post' | 'story' | 'reel'>(
    initialData?.postType || 'post'
  );
  const [accessLevel, setAccessLevel] = React.useState<'free' | 'subscribers' | 'ppv'>(
    initialData?.accessLevel || 'subscribers'
  );
  const [ppvPrice, setPpvPrice] = React.useState<string>(initialData?.ppvPrice?.toString() || '');
  const [isNsfw, setIsNsfw] = React.useState(initialData?.isNsfw || false);
  const [commentsEnabled, setCommentsEnabled] = React.useState(
    initialData?.commentsEnabled ?? true
  );
  const [uploadedMedia, setUploadedMedia] = React.useState<string[]>(initialData?.mediaIds || []);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      const mediaIds: string[] = [];

      for (const file of Array.from(files)) {
        // Request upload URL
        const urlRes = await fetch('/api/media/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });

        if (!urlRes.ok) throw new Error('Failed to get upload URL');
        const { uploadUrl, mediaId, key } = await urlRes.json();

        // Upload directly to S3
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error('Upload failed');

        // Confirm upload
        await fetch('/api/media/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaId, key }),
        });

        mediaIds.push(mediaId);
      }

      setUploadedMedia((prev) => [...prev, ...mediaIds]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publishNow = false) => {
    e.preventDefault();

    await onSubmit({
      content,
      postType,
      accessLevel,
      ppvPrice: accessLevel === 'ppv' ? parseFloat(ppvPrice) : undefined,
      isNsfw,
      commentsEnabled,
      mediaIds: uploadedMedia,
      status: publishNow ? 'published' : 'draft',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type */}
          <div className="space-y-2">
            <Label>Post Type</Label>
            <div className="flex gap-2">
              {(['post', 'story', 'reel'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={postType === type ? 'default' : 'outline'}
                  onClick={() => setPostType(type)}
                  size="sm"
                >
                  {type === 'post' ? '📝 Post' : type === 'story' ? '⏰ Story' : '🎬 Reel'}
                </Button>
              ))}
            </div>
            {postType === 'story' && (
              <p className="text-sm text-muted-foreground">Stories disappear after 24 hours</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={5000}
            />
            <p className="text-right text-sm text-muted-foreground">{content.length}/5000</p>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>Media</Label>
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : '📷 Add Media'}
              </Button>
              {uploadedMedia.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {uploadedMedia.map((id, i) => (
                    <Badge key={id} variant="secondary">
                      Media {i + 1} ✓
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <Label>Who can see this?</Label>
            <div className="flex gap-2">
              {(['free', 'subscribers', 'ppv'] as const).map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant={accessLevel === level ? 'default' : 'outline'}
                  onClick={() => setAccessLevel(level)}
                  size="sm"
                >
                  {level === 'free'
                    ? '🌍 Everyone'
                    : level === 'subscribers'
                      ? '⭐ Subscribers'
                      : '💰 PPV'}
                </Button>
              ))}
            </div>
          </div>

          {/* PPV Price */}
          {accessLevel === 'ppv' && (
            <div className="space-y-2">
              <Label htmlFor="ppvPrice">Unlock Price ($)</Label>
              <Input
                id="ppvPrice"
                type="number"
                min="1"
                max="500"
                step="0.01"
                value={ppvPrice}
                onChange={(e) => setPpvPrice(e.target.value)}
                placeholder="9.99"
              />
            </div>
          )}

          {/* Options */}
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isNsfw}
                onChange={(e) => setIsNsfw(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Mark as NSFW</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={commentsEnabled}
                onChange={(e) => setCommentsEnabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Allow comments</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || (!content && uploadedMedia.length === 0)}
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting || (!content && uploadedMedia.length === 0)}
            >
              Publish Now
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
