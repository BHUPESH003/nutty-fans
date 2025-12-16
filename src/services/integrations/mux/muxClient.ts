import crypto from 'crypto';

import type {
  MuxCreateUploadResponse,
  MuxAssetResponse,
  MuxUploadResult,
  MuxAssetStatus,
  MuxPlaybackUrls,
  MuxWebhookPayload,
} from './types';

const MUX_TOKEN_ID = process.env['MUX_TOKEN_ID'] ?? '';
const MUX_TOKEN_SECRET = process.env['MUX_TOKEN_SECRET'] ?? '';
const MUX_WEBHOOK_SECRET = process.env['MUX_WEBHOOK_SECRET'] ?? '';
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
   * Client uploads directly to Mux (no server involvement)
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
}

// Singleton instance
export const muxClient = new MuxClient();
