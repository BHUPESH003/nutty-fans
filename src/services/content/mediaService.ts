import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { MediaRepository } from '@/repositories/mediaRepository';
import { muxClient } from '@/services/integrations/mux/muxClient';
import type { FileMetadata, UploadUrlResponse, MediaType } from '@/types/content';

/** Normalize Mux "16:9" / "9:16" into pixel dimensions that preserve aspect ratio for the feed. */
function parseMuxAspectRatioString(s: string): { width: number; height: number } | null {
  const m = s.trim().match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
  if (!m?.[1] || !m[2]) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!(a > 0) || !(b > 0)) return null;
  const scale = 1000;
  return { width: Math.round(a * scale), height: Math.round(b * scale) };
}

const AWS_REGION = process.env['AWS_REGION'] ?? 'us-east-1';
const AWS_S3_BUCKET = process.env['AWS_S3_BUCKET'] ?? '';
const AWS_ACCESS_KEY_ID = process.env['AWS_ACCESS_KEY_ID'] ?? '';
const AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'] ?? '';
const CLOUDFRONT_URL = process.env['CLOUDFRONT_URL'] ?? '';

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

// File size limits
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export class MediaService {
  private mediaRepo: MediaRepository;

  constructor() {
    this.mediaRepo = new MediaRepository();
  }

  /**
   * Get presigned URL for image upload
   */
  async getImageUploadUrl(creatorId: string, file: FileMetadata): Promise<UploadUrlResponse> {
    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.contentType)) {
      throw new Error('Invalid image type. Allowed: JPG, PNG, GIF, WebP');
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('Image too large. Maximum size: 20MB');
    }

    // Create media record first to get the actual ID
    const media = await this.mediaRepo.create({
      creatorId,
      mediaType: 'image',
      originalUrl: '', // Will be set on confirm
      mimeType: file.contentType,
      fileSize: file.size,
    });

    const mediaId = media.id;
    const key = `uploads/${creatorId}/${mediaId}/${file.filename}`;
    const expiresIn = 3600; // 1 hour

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      ContentType: file.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      uploadUrl,
      mediaId,
      key,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * Get S3 presigned URL for video upload (CORRECT PIPELINE: S3 -> Mux)
   * All videos MUST go to S3 first, then Mux ingestion is triggered
   */
  async getVideoUploadUrl(creatorId: string, file: FileMetadata): Promise<UploadUrlResponse> {
    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.contentType)) {
      throw new Error('Invalid video type. Allowed: MP4, MOV, WebM');
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error('Video too large. Maximum size: 5GB');
    }

    // Create media record first to get the actual ID
    const media = await this.mediaRepo.create({
      creatorId,
      mediaType: 'video',
      originalUrl: '', // Will be set on confirm with S3 URL
      mimeType: file.contentType,
      fileSize: file.size,
    });

    const mediaId = media.id;
    const key = `uploads/${creatorId}/${mediaId}/${file.filename}`;
    const expiresIn = 3600; // 1 hour

    // Create presigned URL for S3 upload (same as images)
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      ContentType: file.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      uploadUrl,
      mediaId,
      key,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * Confirm video upload and trigger Mux ingestion from S3
   * After video is uploaded to S3, this triggers Mux to create asset from S3 URL
   */
  async confirmVideoUpload(
    mediaId: string,
    creatorId: string,
    data: {
      key: string;
      width?: number;
      height?: number;
    }
  ) {
    const media = await this.mediaRepo.findById(mediaId);
    if (!media) throw new Error('Media not found');
    if (media.creatorId !== creatorId) throw new Error('Unauthorized');
    if (media.mediaType !== 'video') throw new Error('Media is not a video');

    // S3 URL is the source of truth (CloudFront CDN URL)
    const s3Url = `${CLOUDFRONT_URL}/${data.key}`;

    // For Mux ingestion, generate a presigned S3 URL (valid for 24 hours)
    // Mux needs to download the file from S3, so we provide a presigned URL
    const getObjectCommand = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: data.key,
    });
    const s3PresignedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 86400 }); // 24 hours

    // Update media record with S3 URL (source of truth)
    await this.mediaRepo.confirmUpload(mediaId, {
      originalUrl: s3Url, // CloudFront URL for reference, but S3 direct URL used for Mux
      width: data.width,
      height: data.height,
    });

    // Update status to processing
    await this.mediaRepo.updateProcessingStatus(mediaId, 'processing', {
      metadata: { s3Key: data.key, s3Url: s3Url },
    });

    try {
      // Trigger Mux asset creation from S3 presigned URL
      // Mux will download the file from S3 using the presigned URL
      const { assetId } = await muxClient.createAssetFromUrl(s3PresignedUrl, mediaId);

      // Store Mux asset ID in metadata for webhook processing
      // NOTE: S3 URL (s3Url) remains in originalUrl as source of truth
      await this.mediaRepo.updateProcessingStatus(mediaId, 'processing', {
        metadata: {
          s3Key: data.key,
          s3Url: s3Url, // CloudFront URL is stored as source of truth
          muxAssetId: assetId,
        },
      });
    } catch (error) {
      console.error('Failed to trigger Mux ingestion:', error);
      await this.mediaRepo.updateProcessingStatus(mediaId, 'failed', {
        metadata: {
          s3Key: data.key,
          s3Url: s3Url,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw new Error('Failed to trigger video processing');
    }

    return this.mediaRepo.findById(mediaId);
  }

  /**
   * Confirm image upload and start processing
   */
  async confirmImageUpload(
    mediaId: string,
    creatorId: string,
    data: {
      key: string;
      width?: number;
      height?: number;
    }
  ) {
    const media = await this.mediaRepo.findById(mediaId);
    if (!media) throw new Error('Media not found');
    if (media.creatorId !== creatorId) throw new Error('Unauthorized');

    const originalUrl = `${CLOUDFRONT_URL}/${data.key}`;

    // Update with confirmed upload data
    await this.mediaRepo.confirmUpload(mediaId, {
      originalUrl,
      width: data.width,
      height: data.height,
    });

    // TODO: Queue background job for image processing
    // - Generate thumbnail
    // - Create multiple sizes
    // - Apply invisible watermark

    // For now, mark as completed immediately
    await this.mediaRepo.updateProcessingStatus(mediaId, 'completed', {
      processedUrl: originalUrl,
      thumbnailUrl: originalUrl, // Same as original for now
    });

    return this.mediaRepo.findById(mediaId);
  }

  /**
   * Confirm upload (image or video) by looking up the media record
   * and dispatching to the correct confirm handler.
   */
  async confirmUpload(
    mediaId: string,
    creatorId: string,
    data: {
      key: string;
      width?: number;
      height?: number;
    }
  ) {
    const media = await this.mediaRepo.findById(mediaId);
    if (!media) throw new Error('Media not found');

    if (media.mediaType === 'video') {
      return this.confirmVideoUpload(mediaId, creatorId, data);
    }

    return this.confirmImageUpload(mediaId, creatorId, data);
  }

  /**
   * Handle Mux webhook for video processing
   * NOTE: S3 URL remains in originalUrl (source of truth)
   * Mux playback URLs are stored in processedUrl for delivery
   */
  async handleMuxWebhook(payload: {
    type: string;
    data: {
      id: string;
      status?: string;
      asset_id?: string;
      playback_ids?: Array<{ id: string; policy: string }>;
      duration?: number;
      passthrough?: string;
      errors?: { type: string; messages: string[] };
    };
  }) {
    const mediaId = payload.data.passthrough;
    if (!mediaId) {
      console.warn('Mux webhook without passthrough (mediaId)');
      return;
    }

    const media = await this.mediaRepo.findById(mediaId);
    if (!media) {
      console.warn(`Media not found for Mux webhook: ${mediaId}`);
      return;
    }

    switch (payload.type) {
      case 'video.asset.created':
        // Asset created, processing started
        await this.mediaRepo.updateProcessingStatus(mediaId, 'processing', {
          metadata: {
            ...(typeof media.metadata === 'object' && media.metadata !== null
              ? media.metadata
              : {}),
            muxAssetId: payload.data.id,
          },
        });
        break;

      case 'video.asset.ready': {
        // Video ready for playback
        // Store Mux playback URLs in processedUrl (for delivery)
        // Keep S3 URL in originalUrl (source of truth)
        const playbackId = payload.data.playback_ids?.[0]?.id;
        const raw = payload.data as Record<string, unknown>;
        let width: number | undefined;
        let height: number | undefined;

        const tracks = raw['tracks'] as
          | Array<{ type?: string; max_width?: number; max_height?: number }>
          | undefined;
        const videoTrack = tracks?.find((t) => t.type === 'video');
        if (videoTrack?.max_width && videoTrack?.max_height) {
          width = videoTrack.max_width;
          height = videoTrack.max_height;
        } else if (typeof raw['aspect_ratio'] === 'string') {
          const parsed = parseMuxAspectRatioString(raw['aspect_ratio']);
          if (parsed) {
            width = parsed.width;
            height = parsed.height;
          }
        }

        if (playbackId) {
          const urls = muxClient.getPlaybackUrls(playbackId);
          const currentMetadata =
            typeof media.metadata === 'object' && media.metadata !== null ? media.metadata : {};
          await this.mediaRepo.updateProcessingStatus(mediaId, 'completed', {
            processedUrl: urls.streamUrl, // Mux HLS URL for playback
            thumbnailUrl: urls.thumbnailUrl,
            previewUrl: urls.gifUrl,
            duration: payload.data.duration ? Math.round(payload.data.duration) : undefined,
            ...(width != null && height != null ? { width, height } : {}),
            metadata: {
              ...currentMetadata,
              muxAssetId: payload.data.id,
              muxPlaybackId: playbackId,
              // S3 URL remains in originalUrl (source of truth)
            },
          });
        }
        break;
      }

      case 'video.asset.errored': {
        // Processing failed
        const errorMetadata =
          typeof media.metadata === 'object' && media.metadata !== null ? media.metadata : {};
        await this.mediaRepo.updateProcessingStatus(mediaId, 'failed', {
          metadata: {
            ...errorMetadata,
            error: payload.data.errors?.messages?.join(', ') ?? 'Unknown error',
          },
        });
        break;
      }
    }
  }

  /**
   * Get media processing status
   */
  async getStatus(mediaId: string) {
    const media = await this.mediaRepo.findById(mediaId);
    if (!media) throw new Error('Media not found');

    return {
      id: media.id,
      mediaType: media.mediaType,
      processingStatus: media.processingStatus,
      originalUrl: media.originalUrl,
      processedUrl: media.processedUrl,
      thumbnailUrl: media.thumbnailUrl,
    };
  }

  /**
   * Get media type from content type
   */
  getMediaType(contentType: string): MediaType {
    if (ALLOWED_IMAGE_TYPES.includes(contentType)) return 'image';
    if (ALLOWED_VIDEO_TYPES.includes(contentType)) return 'video';
    throw new Error('Unsupported media type');
  }
}
