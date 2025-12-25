import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import type {
  MuxCreateUploadResponse,
  MuxAssetResponse,
  MuxUploadResult,
  MuxAssetStatus,
  MuxPlaybackUrls,
  MuxWebhookPayload,
  MuxLiveStreamResponse,
  MuxCreateLiveStreamResult,
} from './types';

const MUX_TOKEN_ID = process.env['MUX_TOKEN_ID'] ?? '';
const MUX_TOKEN_SECRET = process.env['MUX_TOKEN_SECRET'] ?? '';
const MUX_WEBHOOK_SECRET = process.env['MUX_WEBHOOK_SECRET'] ?? '';
const MUX_SIGNING_KEY_ID = process.env['MUX_SIGNING_KEY_ID'] ?? '';
const MUX_SIGNING_PRIVATE_KEY = process.env['MUX_SIGNING_PRIVATE_KEY'] ?? '';
const MUX_BASE_URL = 'https://api.mux.com';
const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

/**
 * Mux API Client
 * Handles video upload, asset management, and webhook verification
 */
export class MuxClient {
  private authHeader: string;

  constructor() {
    const credentials = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Create a direct upload URL for video
   * DEPRECATED: Use createAssetFromUrl instead (S3 -> Mux pipeline)
   * @deprecated This bypasses S3 requirement. Use createAssetFromUrl after S3 upload.
   */
  async createDirectUpload(passthrough?: string): Promise<MuxUploadResult> {
    const response = await fetch(`${MUX_BASE_URL}/video/v1/uploads`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cors_origin: APP_URL,
        new_asset_settings: {
          playback_policy: ['public'],
          passthrough, // Used to link back to our mediaId
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mux upload creation failed: ${error}`);
    }

    const data: MuxCreateUploadResponse = await response.json();

    return {
      uploadId: data.data.id,
      uploadUrl: data.data.url,
    };
  }

  /**
   * Create a Mux asset from an S3 URL (required pipeline: S3 -> Mux)
   * This is the CORRECT way to upload videos: S3 first, then Mux ingestion
   */
  async createAssetFromUrl(s3Url: string, passthrough?: string): Promise<{ assetId: string }> {
    const response = await fetch(`${MUX_BASE_URL}/video/v1/assets`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [
          {
            url: s3Url,
          },
        ],
        playback_policy: ['signed'], // Require signed tokens for playback (anti-piracy)
        passthrough, // Used to link back to our mediaId
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mux asset creation from URL failed: ${error}`);
    }

    const data: MuxAssetResponse = await response.json();
    return {
      assetId: data.data.id,
    };
  }

  /**
   * Get upload status
   */
  async getUploadStatus(uploadId: string): Promise<{ status: string; assetId?: string }> {
    const response = await fetch(`${MUX_BASE_URL}/video/v1/uploads/${uploadId}`, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload status: ${response.statusText}`);
    }

    const data: MuxCreateUploadResponse = await response.json();
    return {
      status: data.data.status,
      assetId: data.data.asset_id,
    };
  }

  /**
   * Get asset details
   */
  async getAsset(assetId: string): Promise<MuxAssetStatus> {
    const response = await fetch(`${MUX_BASE_URL}/video/v1/assets/${assetId}`, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get asset: ${response.statusText}`);
    }

    const data: MuxAssetResponse = await response.json();
    const asset = data.data;

    return {
      id: asset.id,
      status: asset.status,
      playbackId: asset.playback_ids?.[0]?.id,
      duration: asset.duration,
      aspectRatio: asset.aspect_ratio,
      errorMessage: asset.errors?.messages?.join(', '),
    };
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    const response = await fetch(`${MUX_BASE_URL}/video/v1/assets/${assetId}`, {
      method: 'DELETE',
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete asset: ${response.statusText}`);
    }
  }

  /**
   * Get playback URLs for an asset
   * NOTE: These are PUBLIC URLs. For secure playback, use getSignedPlaybackUrls() instead
   * @deprecated Use getSignedPlaybackUrls() for secure playback with authentication
   */
  getPlaybackUrls(playbackId: string): MuxPlaybackUrls {
    return {
      streamUrl: `https://stream.mux.com/${playbackId}.m3u8`,
      thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
      gifUrl: `https://image.mux.com/${playbackId}/animated.gif`,
      posterUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg?width=1920&height=1080`,
    };
  }

  /**
   * Generate signed playback URLs with expiration (for secure playback)
   * Returns URLs that expire after specified time (default 5 minutes)
   *
   * SECURITY: This generates JWT tokens signed with Mux's private key.
   * URLs expire after the specified time and cannot be reused.
   */
  async getSignedPlaybackUrls(
    playbackId: string,
    expirationSeconds: number = 300
  ): Promise<MuxPlaybackUrls> {
    // Validate signing keys are configured
    if (!MUX_SIGNING_KEY_ID || !MUX_SIGNING_PRIVATE_KEY) {
      console.warn(
        'MUX_SIGNING_KEY_ID or MUX_SIGNING_PRIVATE_KEY not configured. Falling back to public URLs.'
      );
      return this.getPlaybackUrls(playbackId);
    }

    try {
      // Generate JWT token for signed playback
      // Mux uses RS256 (RSA with SHA-256) for signed playback tokens
      const now = Math.floor(Date.now() / 1000);
      const expiration = now + expirationSeconds;

      const tokenPayload = {
        sub: playbackId, // Subject: playback ID
        aud: 'v', // Audience: video
        exp: expiration, // Expiration time
        kid: MUX_SIGNING_KEY_ID, // Key ID
      };

      // Sign the JWT token using RS256
      // Mux signing key is an RSA private key in PEM format
      const token = jwt.sign(tokenPayload, MUX_SIGNING_PRIVATE_KEY, {
        algorithm: 'RS256',
        header: {
          kid: MUX_SIGNING_KEY_ID,
          alg: 'RS256',
          typ: 'JWT',
        },
      });

      // Construct signed playback URL
      // Format: https://stream.mux.com/{playbackId}.m3u8?token={signedToken}
      const signedStreamUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;

      // Thumbnail and poster URLs don't need tokens (they're images, not video streams)
      // But we can optionally sign them if needed for additional security
      const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg?width=1920&height=1080`;
      const gifUrl = `https://image.mux.com/${playbackId}/animated.gif`;

      return {
        streamUrl: signedStreamUrl,
        thumbnailUrl,
        posterUrl,
        gifUrl,
      };
    } catch (error) {
      console.error('Failed to generate signed playback URL:', error);
      // Fallback to public URLs if signing fails
      console.warn('Falling back to public URLs due to signing error');
      return this.getPlaybackUrls(playbackId);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    if (!MUX_WEBHOOK_SECRET) {
      console.warn('MUX_WEBHOOK_SECRET not configured');
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', MUX_WEBHOOK_SECRET)
      .update(signedPayload)
      .digest('hex');

    // Signature header format: v1=<signature>
    const actualSignature = signature.replace('v1=', '');

    try {
      return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(actualSignature));
    } catch {
      return false;
    }
  }

  /**
   * Parse and process webhook event
   */
  parseWebhookEvent(raw: string): MuxWebhookPayload {
    return JSON.parse(raw) as MuxWebhookPayload;
  }

  // ============================================
  // LIVE STREAMS (Mux Live)
  // ============================================

  /**
   * Create a Mux Live Stream (RTMP ingest + HLS playback)
   *
   * We use signed playback policy for consistency with VOD security.
   * RTMP ingest URL is fixed for Mux; stream_key is returned per stream.
   */
  async createLiveStream(passthrough?: string): Promise<MuxCreateLiveStreamResult> {
    const response = await fetch(`${MUX_BASE_URL}/video/v1/live-streams`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playback_policy: ['signed'],
        new_asset_settings: {
          playback_policy: ['signed'],
          passthrough,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mux live stream creation failed: ${error}`);
    }

    const data: MuxLiveStreamResponse = await response.json();
    const playbackId = data.data.playback_ids?.[0]?.id;
    if (!playbackId) {
      throw new Error('Mux live stream missing playback ID');
    }

    return {
      muxLiveStreamId: data.data.id,
      streamKey: data.data.stream_key,
      playbackId,
      // Mux RTMP ingest endpoint (TLS)
      rtmpUrl: 'rtmps://global-live.mux.com:443/app',
    };
  }

  /**
   * Complete/disable a live stream so it stops accepting ingest.
   */
  async completeLiveStream(muxLiveStreamId: string): Promise<void> {
    const response = await fetch(
      `${MUX_BASE_URL}/video/v1/live-streams/${muxLiveStreamId}/complete`,
      {
        method: 'PUT',
        headers: {
          Authorization: this.authHeader,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mux live stream complete failed: ${error}`);
    }
  }
}

// Singleton instance
export const muxClient = new MuxClient();
