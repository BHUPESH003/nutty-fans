'use client';

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
  onSubmit: (_data: CreatePostInput) => Promise<void>;
  onUploadFiles: (_files: File[]) => Promise<string[]>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PostForm({
  initialData,
  onSubmit,
  onUploadFiles,
  onCancel,
  isSubmitting,
}: PostFormProps) {
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
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [tagsText, setTagsText] = React.useState<string>(
    (initialData as any)?.tags?.join(', ') || ''
  ); // eslint-disable-line @typescript-eslint/no-explicit-any
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const parsedTags = React.useMemo(() => {
    const parts = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    // Unique + cap
    return Array.from(new Set(parts)).slice(0, 10);
  }, [tagsText]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setUploadError(null);
    try {
      const mediaIds = await onUploadFiles(Array.from(files));
      setUploadedMedia((prev) => [...prev, ...mediaIds]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload media';
      setUploadError(message);
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
      tags: parsedTags,
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
              {uploadError && <p className="mt-3 text-sm text-destructive">{uploadError}</p>}
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

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="fitness, yoga, behindthescenes"
              maxLength={200}
            />
            {parsedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {parsedTags.map((t) => (
                  <Badge key={t} variant="secondary">
                    #{t.replace(/^#/, '')}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Up to 10 tags.</p>
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
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
