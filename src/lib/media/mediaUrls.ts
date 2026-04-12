/**
 * Media URL Utilities
 *
 * Handles the conversion between S3 keys, CloudFront URLs, and signed URLs
 *
 * Architecture:
 * - S3 Keys: Permanent identifiers stored in DB metadata (e.g., 'uploads/creatorId/mediaId/file.jpg')
 * - CloudFront URLs: Public CDN URLs that don't expire (e.g., 'https://cdn.domain.net/uploads/...')
 * - Signed URLs: Time-limited URLs for private content access (expires in 1 hour)
 *
 * Usage:
 * - Previews/Thumbnails: Use direct CloudFront URLs (public, no expiry)
 * - Full Media Access: Use signed URLs (private, time-limited)
 * - Upload URLs: Use S3 presigned URLs (separate upload flow)
 */

import {
  generateCloudFrontSignedUrl,
  extractS3KeyFromCloudFrontUrl,
} from '@/lib/storage/cloudfront';
import { CLOUDFRONT_URL } from '@/lib/storage/s3';

/**
 * Get the S3 key from a media item
 * Checks metadata.s3Key first, then extracts from originalUrl
 */
export function getS3KeyFromMedia(media: {
  originalUrl?: string | null;
  metadata?: unknown;
}): string | null {
  if (!media) return null;

  // Try to get from metadata first
  const metadata = media.metadata;
  if (metadata && typeof metadata === 'object') {
    const metaObj = metadata as Record<string, unknown>;
    if (typeof metaObj['s3Key'] === 'string' && metaObj['s3Key']) {
      return metaObj['s3Key'] as string;
    }
  }

  // Extract from originalUrl if it's a CloudFront URL
  if (media.originalUrl) {
    return extractS3KeyFromCloudFrontUrl(media.originalUrl);
  }

  return null;
}

/**
 * Get a permanent CloudFront URL for public media (previews, thumbnails)
 * This URL does NOT expire and can be used for blur previews
 */
export function getCloudFrontUrl(s3Key: string): string {
  return `${CLOUDFRONT_URL}/${s3Key}`;
}

/**
 * Get a time-limited signed URL for private media access
 * This URL expires after the specified time (default: 1 hour)
 */
export function getSignedMediaUrl(s3Key: string, expiresIn: number = 3600): string {
  return generateCloudFrontSignedUrl(s3Key, expiresIn);
}

/**
 * Get the best available preview URL for a media item
 * For blur previews, we use direct CloudFront URLs (no expiry)
 * Returns null if no valid URL can be generated
 */
export function getMediaPreviewUrl(media: {
  id: string;
  originalUrl?: string | null;
  processedUrl?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  metadata?: unknown;
  mediaType?: string;
}): string | null {
  if (!media) return null;

  // Try thumbnail first (best for previews)
  if (media.thumbnailUrl && media.thumbnailUrl !== 'locked') {
    return media.thumbnailUrl;
  }

  // Try preview URL (for video teasers)
  if (media.previewUrl && media.previewUrl !== 'locked') {
    return media.previewUrl;
  }

  // Try processed URL
  if (media.processedUrl && media.processedUrl !== 'locked') {
    return media.processedUrl;
  }

  // Fall back to original URL
  if (media.originalUrl && media.originalUrl !== 'locked') {
    return media.originalUrl;
  }

  // If we have an S3 key, generate a CloudFront URL
  const s3Key = getS3KeyFromMedia(media);
  if (s3Key) {
    return getCloudFrontUrl(s3Key);
  }

  return null;
}

/**
 * Check if a URL is a CloudFront URL
 */
export function isCloudFrontUrl(url: string): boolean {
  return url.startsWith(CLOUDFRONT_URL);
}

/**
 * Check if a URL is expired (for monitoring/debugging)
 * Signed URLs have an Expires parameter
 */
export function isUrlExpired(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const expiresParam = urlObj.searchParams.get('Expires');
    if (!expiresParam) return false; // No expiry = not expired (unsigned URL)

    const expiresTime = parseInt(expiresParam, 10) * 1000; // Convert to milliseconds
    return Date.now() > expiresTime;
  } catch {
    return false; // Invalid URL
  }
}
