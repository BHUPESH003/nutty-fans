/**
 * Mux API Types
 * Types for Mux video processing integration
 */

// ============================================
// UPLOAD
// ============================================

export interface MuxCreateUploadRequest {
  cors_origin?: string;
  new_asset_settings?: {
    playback_policy?: ('public' | 'signed')[];
    passthrough?: string;
  };
}

export interface MuxCreateUploadResponse {
  data: {
    id: string;
    url: string;
    status: 'waiting' | 'asset_created' | 'errored' | 'cancelled' | 'timed_out';
    asset_id?: string;
  };
}

// ============================================
// ASSET
// ============================================

export interface MuxAsset {
  id: string;
  status: 'preparing' | 'ready' | 'errored';
  playback_ids?: Array<{
    id: string;
    policy: 'public' | 'signed';
  }>;
  duration?: number;
  aspect_ratio?: string;
  max_stored_resolution?: string;
  max_stored_frame_rate?: number;
  resolution_tier?: string;
  created_at: string;
  passthrough?: string;
  errors?: {
    type: string;
    messages: string[];
  };
}

export interface MuxAssetResponse {
  data: MuxAsset;
}

// ============================================
// PLAYBACK
// ============================================

export interface MuxPlaybackUrls {
  streamUrl: string;
  thumbnailUrl: string;
  gifUrl: string;
  posterUrl: string;
}

// ============================================
// WEBHOOKS
// ============================================

export type MuxWebhookEventType =
  | 'video.upload.created'
  | 'video.upload.asset_created'
  | 'video.asset.created'
  | 'video.asset.ready'
  | 'video.asset.errored'
  | 'video.asset.deleted';

export interface MuxWebhookPayload {
  type: MuxWebhookEventType;
  object: {
    type: 'upload' | 'asset';
    id: string;
  };
  id: string;
  environment: {
    name: string;
    id: string;
  };
  data: {
    id: string;
    status?: string;
    asset_id?: string;
    playback_ids?: Array<{ id: string; policy: string }>;
    duration?: number;
    aspect_ratio?: string;
    passthrough?: string;
    errors?: {
      type: string;
      messages: string[];
    };
  };
  created_at: string;
}

// ============================================
// INTERNAL
// ============================================

export interface MuxUploadResult {
  uploadId: string;
  uploadUrl: string;
}

export interface MuxAssetStatus {
  id: string;
  status: 'preparing' | 'ready' | 'errored';
  playbackId?: string;
  duration?: number;
  aspectRatio?: string;
  errorMessage?: string;
}
