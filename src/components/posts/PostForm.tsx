'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { readMediaDimensionsFromFile } from '@/lib/media/readMediaDimensions';
import { apiClient } from '@/services/apiClient';
import type {
  BlurRegion,
  CropRegion,
  CreatePostInput,
  PostOverlay,
  PostPreviewType,
} from '@/types/content';

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
  type MediaPreviewItem = {
    url: string;
    mediaType: 'image' | 'video';
    fileName: string;
    mediaId: string | null;
  };

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
  const [mediaPreviewItems, setMediaPreviewItems] = React.useState<MediaPreviewItem[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [tagsText, setTagsText] = React.useState<string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (initialData as any)?.tags?.join(', ') || ''
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const previewUrlsRef = React.useRef<string[]>([]);

  // ============================
  // Preview Settings
  // ============================
  const [previewType, setPreviewType] = React.useState<PostPreviewType>(
    initialData?.previewConfig?.type ?? 'none'
  );
  const [blurIntensity, setBlurIntensity] = React.useState<number>(
    initialData?.previewConfig?.blurIntensity ?? 12
  );
  const [blurRegions, setBlurRegions] = React.useState<BlurRegion[]>(
    initialData?.previewConfig?.blurRegions ?? []
  );
  const [cropRegion, setCropRegion] = React.useState<CropRegion | undefined>(
    initialData?.previewConfig?.cropRegion
  );
  const [teaserDuration, setTeaserDuration] = React.useState<number>(
    initialData?.previewConfig?.teaserDuration ?? 5
  );

  const [overlays, setOverlays] = React.useState<PostOverlay[]>(initialData?.overlays ?? []);
  const [overlayKind, setOverlayKind] = React.useState<PostOverlay['type']>('sticker');
  const [stickerUploading, setStickerUploading] = React.useState(false);
  const [stickerError, setStickerError] = React.useState<string | null>(null);
  const stickerFileInputRef = React.useRef<HTMLInputElement>(null);

  // Editor for region selection + overlay positioning (percent coords are stored).
  const editorFrameRef = React.useRef<HTMLDivElement>(null);
  const selectionStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [selectionDraft, setSelectionDraft] = React.useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [activeOverlayIndex, setActiveOverlayIndex] = React.useState<number | null>(null);
  const overlayDragRef = React.useRef<null | {
    index: number;
    mode: 'drag' | 'resize';
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    pointerStartX: number;
    pointerStartY: number;
  }>(null);

  const parsedTags = React.useMemo(() => {
    const parts = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    // Unique + cap
    return Array.from(new Set(parts)).slice(0, 10);
  }, [tagsText]);

  const editorBaseItem = React.useMemo(() => {
    const imageItems = mediaPreviewItems.filter((i) => i.mediaType === 'image');
    return imageItems[0] ?? mediaPreviewItems[0] ?? null;
  }, [mediaPreviewItems]);

  const editorBaseUrl = editorBaseItem?.url ?? null;
  const editorIsImage = editorBaseItem?.mediaType === 'image';
  const isRegionSelectionMode = previewType === 'partial_blur' || previewType === 'crop';

  const clampPercent = (n: number) => Math.max(0, Math.min(100, n));

  const clientToPercent = (clientX: number, clientY: number) => {
    const rect = editorFrameRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return { x: clampPercent(x), y: clampPercent(y) };
  };

  const handleStickerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow image stickers/masks.
    if (!file.type.startsWith('image/')) {
      setStickerError('Sticker must be an image file');
      return;
    }

    setStickerUploading(true);
    setStickerError(null);

    try {
      const { uploadUrl, mediaId, key } = await apiClient.content.getUploadUrl(
        file.name,
        file.type,
        file.size
      );

      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!s3Res.ok) {
        throw new Error(`Sticker upload failed: ${s3Res.status}`);
      }

      const dims = await readMediaDimensionsFromFile(file);
      const confirmed = await apiClient.content.confirmUpload(mediaId, key, dims);

      const confirmedMedia = confirmed as {
        processedUrl?: string | null;
        originalUrl?: string | null;
        thumbnailUrl?: string | null;
      };
      const assetUrl =
        confirmedMedia.processedUrl ?? confirmedMedia.originalUrl ?? confirmedMedia.thumbnailUrl;
      if (!assetUrl || typeof assetUrl !== 'string') {
        throw new Error('Sticker URL missing after upload confirmation');
      }

      // Default initial box size; user can resize/drag in the editor.
      const nextOverlay: PostOverlay = {
        type: overlayKind,
        assetUrl,
        x: 8,
        y: 8,
        width: 26,
        height: 26,
      };
      setOverlays((prev) => [...prev, nextOverlay]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload sticker';
      setStickerError(message);
    } finally {
      setStickerUploading(false);
      if (stickerFileInputRef.current) stickerFileInputRef.current.value = '';
    }
  };

  const handleEditorPointerDown = (e: React.PointerEvent) => {
    if (!editorIsImage) return;
    if (!isRegionSelectionMode) return;
    if (previewType !== 'partial_blur' && previewType !== 'crop') return;
    if (e.button !== 0) return;

    // Only start region selection if we're not interacting with overlays.
    // Overlays stopPropagation so we won't start selection on them.
    const { x, y } = clientToPercent(e.clientX, e.clientY);
    selectionStartRef.current = { x, y };
    setSelectionDraft({ startX: x, startY: y, currentX: x, currentY: y });

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // no-op
    }
  };

  const handleEditorPointerMove = (e: React.PointerEvent) => {
    if (!selectionStartRef.current) return;
    const { x, y } = clientToPercent(e.clientX, e.clientY);
    setSelectionDraft((prev) => {
      if (!prev) return null;
      return { ...prev, currentX: x, currentY: y };
    });
  };

  const handleEditorPointerUp = () => {
    const start = selectionStartRef.current;
    const draft = selectionDraft;
    selectionStartRef.current = null;
    setSelectionDraft(null);

    if (!start || !draft) return;

    const xMin = Math.min(draft.startX, draft.currentX);
    const yMin = Math.min(draft.startY, draft.currentY);
    const width = Math.abs(draft.currentX - draft.startX);
    const height = Math.abs(draft.currentY - draft.startY);

    // Ignore tiny selections (accidental taps).
    if (width < 1 || height < 1) return;

    if (previewType === 'partial_blur') {
      const region: BlurRegion = {
        x: clampPercent(xMin),
        y: clampPercent(yMin),
        width: clampPercent(width),
        height: clampPercent(height),
      };
      setBlurRegions((prev) => [...prev, region]);
    }

    if (previewType === 'crop') {
      const region: CropRegion = {
        x: clampPercent(xMin),
        y: clampPercent(yMin),
        width: clampPercent(width),
        height: clampPercent(height),
      };
      setCropRegion(region);
    }
  };

  const startOverlayInteraction = (
    index: number,
    mode: 'drag' | 'resize',
    e: React.PointerEvent
  ) => {
    const rect = editorFrameRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Prevent region selection from starting underneath overlays.
    e.stopPropagation();
    e.preventDefault();

    const overlay = overlays[index];
    if (!overlay) return;
    setActiveOverlayIndex(index);

    overlayDragRef.current = {
      index,
      mode,
      startX: overlay.x,
      startY: overlay.y,
      startW: overlay.width,
      startH: overlay.height,
      pointerStartX: e.clientX,
      pointerStartY: e.clientY,
    };

    const onMove = (ev: PointerEvent) => {
      const drag = overlayDragRef.current;
      if (!drag) return;
      const frameRect = editorFrameRef.current?.getBoundingClientRect();
      if (!frameRect) return;

      const dxPercent = ((ev.clientX - drag.pointerStartX) / frameRect.width) * 100;
      const dyPercent = ((ev.clientY - drag.pointerStartY) / frameRect.height) * 100;

      setOverlays((prev) =>
        prev.map((o, i) => {
          if (i !== drag.index) return o;

          if (drag.mode === 'drag') {
            const nextX = clampPercent(drag.startX + dxPercent);
            const nextY = clampPercent(drag.startY + dyPercent);
            // Keep within bounds given current size.
            const maxX = 100 - drag.startW;
            const maxY = 100 - drag.startH;
            return {
              ...o,
              x: Math.max(0, Math.min(maxX, nextX)),
              y: Math.max(0, Math.min(maxY, nextY)),
            };
          }

          // resize (bottom-right handle)
          const maxW = 100 - drag.startX;
          const maxH = 100 - drag.startY;
          const nextW = Math.max(1, Math.min(maxW, drag.startW + dxPercent));
          const nextH = Math.max(1, Math.min(maxH, drag.startH + dyPercent));
          return { ...o, width: nextW, height: nextH };
        })
      );
    };

    const onUp = () => {
      overlayDragRef.current = null;
      setActiveOverlayIndex(null);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setUploadError(null);
    const fileList = Array.from(files);
    const previewItemsToAdd: MediaPreviewItem[] = fileList.map((file) => {
      const mediaType: MediaPreviewItem['mediaType'] = file.type.startsWith('video/')
        ? 'video'
        : 'image';
      const url = URL.createObjectURL(file);
      previewUrlsRef.current.push(url);
      return {
        url,
        mediaType,
        fileName: file.name,
        mediaId: null as string | null,
      };
    });

    // Optimistic local preview (doesn't require backend URLs yet).
    setMediaPreviewItems((prev) => [...prev, ...previewItemsToAdd]);

    try {
      const mediaIds = await onUploadFiles(fileList);
      setUploadedMedia((prev) => [...prev, ...mediaIds]);
      setMediaPreviewItems((prev) => {
        const startIndex = prev.length - previewItemsToAdd.length;
        return prev.map((item, idx) => {
          if (idx < startIndex) return item;
          if (idx >= startIndex + previewItemsToAdd.length) return item;
          const mediaId = mediaIds[idx - startIndex] ?? null;
          return { ...item, mediaId };
        });
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload media';
      setUploadError(message);
      // Best-effort cleanup: revoke and remove only the preview items we added for this selection.
      const urlsToRemove = new Set(previewItemsToAdd.map((p) => p.url));
      previewItemsToAdd.forEach((p) => URL.revokeObjectURL(p.url));
      setMediaPreviewItems((prev) => prev.filter((p) => !urlsToRemove.has(p.url)));
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    // Capture a stable reference to the array stored in the ref.
    // We mutate that same array as users select files, so cleanup will still see them.
    const urlsToRevoke = previewUrlsRef.current;
    return () => {
      // Avoid memory leaks from object URLs created for previews.
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

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
      previewConfig: {
        type: previewType,
        ...(previewType === 'blur' || previewType === 'partial_blur'
          ? { blurIntensity: Math.max(0, Math.min(20, blurIntensity)) }
          : {}),
        ...(previewType === 'partial_blur' ? { blurRegions } : {}),
        ...(previewType === 'crop' && cropRegion ? { cropRegion } : {}),
        ...(previewType === 'teaser' ? { teaserDuration } : {}),
      },
      overlays,
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
              {mediaPreviewItems.length > 0 || uploadedMedia.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {(() => {
                    const uploadedFromPreviews = mediaPreviewItems.filter((p) => p.mediaId).length;
                    const existingMediaCount = Math.max(
                      0,
                      uploadedMedia.length - uploadedFromPreviews
                    );
                    return (
                      <div className="flex flex-wrap justify-center gap-2">
                        {Array.from({ length: existingMediaCount }).map((_, i) => (
                          <Badge key={`existing-${i}`} variant="secondary">
                            Media {i + 1} ✓
                          </Badge>
                        ))}
                      </div>
                    );
                  })()}

                  {mediaPreviewItems.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {mediaPreviewItems.map((item, idx) => {
                        const uploadedFromPreviews = mediaPreviewItems.filter(
                          (p) => p.mediaId
                        ).length;
                        const existingMediaCount = Math.max(
                          0,
                          uploadedMedia.length - uploadedFromPreviews
                        );
                        const mediaNumber = existingMediaCount + idx + 1;
                        return (
                          <div
                            key={item.url}
                            className="relative aspect-[1/1] overflow-hidden rounded-lg border border-surface-container-high/80 bg-surface-container-lowest"
                          >
                            {item.mediaType === 'image' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.url}
                                alt={item.fileName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <video
                                src={item.url}
                                className="h-full w-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            )}
                            <div className="absolute inset-x-1 bottom-1 rounded-md bg-black/40 px-1 py-0.5">
                              <p className="truncate text-[10px] font-semibold text-white">
                                Media {mediaNumber} {item.mediaId ? '✓' : '...'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {/* Preview Settings */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Preview Settings</Label>
              <div className="flex flex-wrap gap-2">
                {(['none', 'blur', 'partial_blur', 'crop', 'teaser'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={previewType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewType(type)}
                  >
                    {type === 'none'
                      ? 'None'
                      : type === 'blur'
                        ? 'Blur'
                        : type === 'partial_blur'
                          ? 'Partial blur'
                          : type === 'crop'
                            ? 'Crop'
                            : 'Teaser'}
                  </Button>
                ))}
              </div>
            </div>

            {(previewType === 'blur' || previewType === 'partial_blur') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Blur Intensity</Label>
                  <span className="text-sm text-muted-foreground">{blurIntensity}</span>
                </div>
                <Slider
                  value={[blurIntensity]}
                  min={0}
                  max={20}
                  step={1}
                  onValueChange={(v) => setBlurIntensity(v[0] ?? 0)}
                />
                <p className="text-xs text-muted-foreground">0 = no blur, 20 = max blur.</p>
              </div>
            )}

            {previewType === 'partial_blur' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Partial Blur Regions</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBlurRegions([])}
                    disabled={blurRegions.length === 0}
                  >
                    Clear
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drag on the frame to add one or more blur rectangles.
                </p>
              </div>
            )}

            {previewType === 'crop' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Crop Region</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCropRegion(undefined)}
                    disabled={!cropRegion}
                  >
                    Reset
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drag on the frame to choose the crop rectangle.
                </p>
              </div>
            )}

            {previewType === 'teaser' && (
              <div className="space-y-2">
                <Label htmlFor="teaserDuration">Teaser Duration (seconds)</Label>
                <Input
                  id="teaserDuration"
                  type="number"
                  min={3}
                  max={10}
                  step={1}
                  value={teaserDuration}
                  onChange={(e) => setTeaserDuration(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Used for locked teaser playback.</p>
              </div>
            )}

            {/* Editor (sticker placement + region selection) */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label>Locked Preview Editor</Label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={overlayKind === 'sticker' ? 'default' : 'outline'}
                      onClick={() => setOverlayKind('sticker')}
                    >
                      Sticker
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={overlayKind === 'mask' ? 'default' : 'outline'}
                      onClick={() => setOverlayKind('mask')}
                    >
                      Mask
                    </Button>
                  </div>
                  <input
                    ref={stickerFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleStickerFileChange}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => stickerFileInputRef.current?.click()}
                    disabled={stickerUploading}
                  >
                    {stickerUploading ? 'Uploading...' : 'Add'}
                  </Button>
                </div>
              </div>
              {stickerError && <p className="text-sm text-destructive">{stickerError}</p>}

              {editorBaseUrl ? (
                <div className="relative">
                  <div
                    ref={editorFrameRef}
                    className="relative w-full overflow-hidden rounded-md bg-black/10"
                    style={{ aspectRatio: '4 / 5' }}
                    onPointerDown={handleEditorPointerDown}
                    onPointerMove={handleEditorPointerMove}
                    onPointerUp={handleEditorPointerUp}
                    role="application"
                    aria-label="Locked preview editor"
                  >
                    {editorIsImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editorBaseUrl}
                        alt="Preview frame"
                        className="absolute inset-0 h-full w-full object-contain"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-4">
                        <span className="text-sm text-muted-foreground">
                          Select an image to enable blur/crop selection.
                        </span>
                      </div>
                    )}

                    {/* Region draft */}
                    {selectionDraft && editorIsImage && isRegionSelectionMode && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${Math.min(selectionDraft.startX, selectionDraft.currentX)}%`,
                          top: `${Math.min(selectionDraft.startY, selectionDraft.currentY)}%`,
                          width: `${Math.abs(selectionDraft.currentX - selectionDraft.startX)}%`,
                          height: `${Math.abs(selectionDraft.currentY - selectionDraft.startY)}%`,
                          background:
                            previewType === 'partial_blur'
                              ? 'rgba(255,255,255,0.15)'
                              : 'rgba(59,130,246,0.12)',
                          border:
                            previewType === 'partial_blur'
                              ? '1px dashed rgba(255,255,255,0.65)'
                              : '1px dashed rgba(59,130,246,0.9)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    {/* Existing blur regions / crop region outlines */}
                    {editorIsImage && previewType === 'partial_blur' && (
                      <>
                        {blurRegions.map((r, idx) => (
                          <div
                            key={`${idx}-${r.x}-${r.y}`}
                            style={{
                              position: 'absolute',
                              left: `${r.x}%`,
                              top: `${r.y}%`,
                              width: `${r.width}%`,
                              height: `${r.height}%`,
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.7)',
                              pointerEvents: 'none',
                            }}
                          />
                        ))}
                      </>
                    )}
                    {editorIsImage && previewType === 'crop' && cropRegion && (
                      <div
                        style={{
                          position: 'absolute',
                          left: `${cropRegion.x}%`,
                          top: `${cropRegion.y}%`,
                          width: `${cropRegion.width}%`,
                          height: `${cropRegion.height}%`,
                          background: 'rgba(59,130,246,0.10)',
                          border: '1px solid rgba(59,130,246,0.95)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}

                    {/* Stickers/masks overlays */}
                    {overlays.map((o, index) => (
                      <div
                        key={`${index}-${o.assetUrl}`}
                        style={{
                          position: 'absolute',
                          left: `${o.x}%`,
                          top: `${o.y}%`,
                          width: `${o.width}%`,
                          height: `${o.height}%`,
                          zIndex: activeOverlayIndex === index ? 5 : 3,
                          touchAction: 'none',
                        }}
                        onPointerDown={(e) => startOverlayInteraction(index, 'drag', e)}
                        role="group"
                        aria-label={o.type}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={o.assetUrl}
                          alt={o.type}
                          className="h-full w-full object-contain"
                          draggable={false}
                          onPointerDown={(e) => e.stopPropagation()}
                        />

                        {/* delete button */}
                        <button
                          type="button"
                          className="absolute right-0 top-0 z-10 -translate-y-1 translate-x-1 rounded-full bg-black/70 px-1 text-xs text-white hover:bg-black/90"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOverlays((prev) => prev.filter((_, i) => i !== index));
                            setActiveOverlayIndex(null);
                          }}
                          aria-label="Remove overlay"
                        >
                          ✕
                        </button>

                        {/* resize handle (bottom-right) */}
                        <div
                          onPointerDown={(e) => startOverlayInteraction(index, 'resize', e)}
                          className="absolute bottom-0 right-0 h-4 w-4 translate-x-1/2 translate-y-1/2 cursor-se-resize rounded-full bg-primary/70 ring-2 ring-background"
                          role="button"
                          aria-label="Resize overlay"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                  Add an image to configure preview blurs/crop and stickers.
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
