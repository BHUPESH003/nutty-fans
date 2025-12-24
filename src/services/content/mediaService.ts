import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { MediaRepository } from '@/repositories/mediaRepository';
import { muxClient } from '@/services/integrations/mux/muxClient';
import type {
  FileMetadata,
  UploadUrlResponse,
  MuxUploadResponse,
  MediaType,
} from '@/types/content';

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
   * Get Mux direct upload URL for video
   */
  async getVideoUploadUrl(creatorId: string, file: FileMetadata): Promise<MuxUploadResponse> {
    // Validate file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.contentType)) {
      throw new Error('Invalid video type. Allowed: MP4, MOV, WebM');
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error('Video too large. Maximum size: 5GB');
    }

    // Create media record first to get ID
    const media = await this.mediaRepo.create({
      creatorId,
      mediaType: 'video',
      originalUrl: '', // Will be updated after Mux processing
      mimeType: file.contentType,
      fileSize: file.size,
    });

    // Create Mux direct upload
    const upload = await muxClient.createDirectUpload(media.id);

    // Store upload ID in metadata for webhook processing
    await this.mediaRepo.updateProcessingStatus(media.id, 'pending', {
      metadata: { muxUploadId: upload.uploadId },
    });

    return {
      uploadUrl: upload.uploadUrl,
      uploadId: upload.uploadId,
      mediaId: media.id,
    };
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
   * Handle Mux webhook for video processing
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
      case 'video.upload.asset_created':
        // Upload complete, asset being created
        await this.mediaRepo.updateProcessingStatus(mediaId, 'processing');
        break;

      case 'video.asset.ready': {
        // Video ready for playback
        const playbackId = payload.data.playback_ids?.[0]?.id;
        if (playbackId) {
          const urls = muxClient.getPlaybackUrls(playbackId);
          await this.mediaRepo.updateProcessingStatus(mediaId, 'completed', {
            processedUrl: urls.streamUrl,
            thumbnailUrl: urls.thumbnailUrl,
            previewUrl: urls.gifUrl,
            duration: payload.data.duration ? Math.round(payload.data.duration) : undefined,
            metadata: {
              muxAssetId: payload.data.id,
              muxPlaybackId: playbackId,
            },
          });
        }
        break;
      }

      case 'video.asset.errored':
        // Processing failed
        await this.mediaRepo.updateProcessingStatus(mediaId, 'failed', {
          metadata: {
            error: payload.data.errors?.messages?.join(', ') ?? 'Unknown error',
          },
        });
        break;
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
