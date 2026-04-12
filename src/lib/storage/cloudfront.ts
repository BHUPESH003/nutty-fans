import { createSign } from 'crypto';

/**
 * CloudFront Signed URL Generator
 *
 * This service generates time-limited signed URLs for CloudFront distribution.
 * Signed URLs restrict access to your domain only and expire after a set time.
 *
 * AWS Setup Required:
 * 1. Create a CloudFront Key Pair (RSA) in AWS Console
 * 2. Download the private key file (.pem)
 * 3. Set CLOUDFRONT_KEY_PAIR_ID env variable
 * 4. Set CLOUDFRONT_PRIVATE_KEY env variable (full RSA private key with headers)
 *
 * Usage:
 * - Public media (previews, avatars): Use direct CloudFront URLs (no signing)
 * - Private media (subscriber content): Use signed URLs with expiration
 * - Upload URLs: Use S3 presigned URLs (separate flow)
 */

const CLOUDFRONT_URL = process.env['CLOUDFRONT_URL'] ?? '';
const CLOUDFRONT_KEY_PAIR_ID = process.env['CLOUDFRONT_KEY_PAIR_ID'] ?? '';
const CLOUDFRONT_PRIVATE_KEY = process.env['CLOUDFRONT_PRIVATE_KEY'] ?? '';

/**
 * Generate a signed URL for CloudFront content
 * @param s3Key - The S3 key (e.g., 'uploads/creatorId/mediaId/file.jpg')
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 * @returns Signed CloudFront URL or direct URL if signing not configured
 */
export function generateCloudFrontSignedUrl(
  s3Key: string,
  expiresIn: number = 3600 // 1 hour default
): string {
  const baseUrl = `${CLOUDFRONT_URL}/${s3Key}`;

  // If no CloudFront signing credentials configured, return direct URL
  // This is normal for development or when using public CloudFront distribution
  if (!CLOUDFRONT_KEY_PAIR_ID || !CLOUDFRONT_PRIVATE_KEY) {
    return baseUrl;
  }

  const expires = Math.floor(Date.now() / 1000) + expiresIn;

  // Format private key properly (add headers/footers if missing)
  let privateKey = CLOUDFRONT_PRIVATE_KEY;
  if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`;
  }

  try {
    const signedUrl = getSignedUrl({
      url: baseUrl,
      keyPairId: CLOUDFRONT_KEY_PAIR_ID,
      privateKey,
      expireTime: expires,
    });
    return signedUrl;
  } catch (error) {
    console.warn('Failed to generate CloudFront signed URL, falling back to direct URL:', error);
    return baseUrl;
  }
}

/**
 * Generate multiple signed URLs in batch
 */
export function generateCloudFrontSignedUrls(
  s3Keys: string[],
  expiresIn: number = 3600
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of s3Keys) {
    result[key] = generateCloudFrontSignedUrl(key, expiresIn);
  }
  return result;
}

/**
 * Get direct CloudFront URL (unsigned, for public content)
 * @param s3Key - The S3 key
 * @returns Public CloudFront URL
 */
export function getCloudFrontPublicUrl(s3Key: string): string {
  return `${CLOUDFRONT_URL}/${s3Key}`;
}

/**
 * Extract S3 key from CloudFront URL
 * @param url - CloudFront URL
 * @returns S3 key or null
 */
export function extractS3KeyFromCloudFrontUrl(url: string): string | null {
  if (!url || !CLOUDFRONT_URL) return null;

  const normalizedUrl = url.replace(/\/+$/, '');
  const prefix = `${CLOUDFRONT_URL.replace(/\/+$/, '')}/`;

  if (normalizedUrl.startsWith(prefix)) {
    return normalizedUrl.slice(prefix.length);
  }

  return null;
}

// Helper function for signing
function getSignedUrl({
  url,
  keyPairId,
  privateKey,
  expireTime,
}: {
  url: string;
  keyPairId: string;
  privateKey: string;
  expireTime: number;
}): string {
  return createSignedUrl(url, keyPairId, privateKey, expireTime);
}

/**
 * Create a signed URL using CloudFront signed URL protocol
 * Uses RSA-SHA1 signature generation
 */
function createSignedUrl(
  url: string,
  keyPairId: string,
  privateKey: string,
  expireTime: number
): string {
  const policy = JSON.stringify({
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: { 'AWS:EpochTime': expireTime },
        },
      },
    ],
  });

  const sign = createSign('RSA-SHA1');
  sign.update(policy);
  sign.end();

  const signature = sign.sign(privateKey);
  const signatureBase64 = signature.toString('base64');

  // Make signature URL-safe
  const signatureUrlSafe = signatureBase64
    .replace(/\+/g, '-')
    .replace(/=/g, '_')
    .replace(/\//g, '~');

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}Key-Pair-Id=${keyPairId}&Signature=${signatureUrlSafe}&Expires=${expireTime}`;
}
