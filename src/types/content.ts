/**
 * Content/Posts Types
 * Types and enums for the Content/Posts System
 */

// ============================================
// ENUMS (mirrors Prisma)
// ============================================

export type PostType = 'post' | 'story' | 'reel';
export type AccessLevel = 'free' | 'subscribers' | 'ppv';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived' | 'removed';
export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'rejected';
export type MediaType = 'image' | 'video' | 'audio';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================
// INPUT DTOs
// ============================================

export interface CreatePostInput {
  content?: string;
  postType?: PostType;
  accessLevel?: AccessLevel;
  ppvPrice?: number;
  categoryIds?: string[];
  isNsfw?: boolean;
  commentsEnabled?: boolean;
  scheduledAt?: Date;
  mediaIds?: string[];
  tags?: string[];
  status?: PostStatus;
  previewConfig?: PostPreviewConfig;
  overlays?: PostOverlay[];
}

export interface UpdatePostInput {
  content?: string;
  accessLevel?: AccessLevel;
  ppvPrice?: number;
  isNsfw?: boolean;
  commentsEnabled?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

export interface CreateCommentInput {
  content: string;
  parentId?: string;
}

export interface FileMetadata {
  filename: string;
  contentType: string;
  size: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface PostWithCreator {
  id: string;
  creatorId: string;
  content: string | null;
  postType: PostType;
  accessLevel: AccessLevel;
  ppvPrice: number | null;
  isPinned: boolean;
  isNsfw: boolean;
  commentsEnabled: boolean;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  previewConfig?: PostPreviewConfig;
  overlays?: PostOverlay[];
  creator: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  media: MediaItem[];
  tags?: Array<{ id: string; name: string; slug: string }>;
  isLiked?: boolean;
  isBookmarked?: boolean;
  hasAccess?: boolean;
}

// ============================================
// Preview configuration (locked preview UX)
// ============================================

export type PostPreviewType = 'none' | 'blur' | 'partial_blur' | 'crop' | 'teaser';

export interface BlurRegion {
  /**
   * Percent coordinates relative to the rendered preview frame (0-100).
   */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropRegion {
  /**
   * Percent coordinates relative to the rendered preview frame (0-100).
   */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PostPreviewConfig {
  type: PostPreviewType;
  blurIntensity?: number; // 0-20 (front-end driven)
  blurRegions?: BlurRegion[];
  cropRegion?: CropRegion;
  teaserDuration?: number; // seconds
}

export interface PostOverlay {
  type: 'sticker' | 'mask';
  /**
   * URL to overlay asset (percent positioning is applied by the UI).
   */
  assetUrl: string;
  x: number; // 0-100
  y: number; // 0-100
  width: number; // 0-100
  height: number; // 0-100
}

export interface MediaItem {
  id: string;
  mediaType: MediaType;
  originalUrl: string;
  processedUrl: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  processingStatus: ProcessingStatus;
  sortOrder: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  mediaId: string;
  key: string;
  expiresAt: Date;
}

export interface MuxUploadResponse {
  uploadUrl: string;
  uploadId: string;
  mediaId: string;
  key: string;
}

export interface FeedResult {
  posts: PostWithCreator[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommentWithUser {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  replyCount: number;
  isHidden: boolean;
  isPinned: boolean;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  replies?: CommentWithUser[];
  isLiked?: boolean;
}

export interface PaginatedComments {
  comments: CommentWithUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ============================================
// ACCESS CONTROL
// ============================================

export interface AccessCheckResult {
  hasAccess: boolean;
  reason: 'owner' | 'subscribed' | 'purchased' | 'free' | 'no_access';
  canPurchase: boolean;
  price?: number;
}

// ============================================
// FILTERS
// ============================================

export interface PostFilters {
  status?: PostStatus;
  postType?: PostType;
  cursor?: string;
  limit?: number;
}
