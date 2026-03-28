import { NextResponse } from 'next/server';

import { successResponse } from '@/lib/api/response';
import { requireEmailVerification } from '@/lib/auth/verificationGuard';
import {
  AppError,
  handleAsyncRoute,
  VALIDATION_MISSING_FIELD,
  RESOURCE_NOT_FOUND,
} from '@/lib/errors/errorHandler';
import { BookmarkRepository } from '@/repositories/bookmarkRepository';
import { LikeRepository } from '@/repositories/likeRepository';
import { PostRepository } from '@/repositories/postRepository';
import { CommentService } from '@/services/content/commentService';
import { FeedService } from '@/services/content/feedService';
import { MediaService } from '@/services/content/mediaService';
import { PostService } from '@/services/content/postService';
import { CreatorAccessService } from '@/services/creator/creatorAccessService';
import { AuthUser } from '@/types/auth';
import type {
  CreatePostInput,
  UpdatePostInput,
  CreateCommentInput,
  FileMetadata,
} from '@/types/content';

const postService = new PostService();
const mediaService = new MediaService();
const feedService = new FeedService();
const commentService = new CommentService();
const likeRepo = new LikeRepository();
const bookmarkRepo = new BookmarkRepository();
const postRepo = new PostRepository();
const creatorAccessService = new CreatorAccessService();

export const contentController = {
  // ============================================
  // POST CRUD
  // ============================================

  async createPost(user: AuthUser, body: CreatePostInput) {
    return handleAsyncRoute(async () => {
      requireEmailVerification(user);
      if (!user.id) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      }
      let creatorId: string;
      try {
        creatorId = await creatorAccessService.requireCreatorIdByUserId(user.id);
      } catch {
        throw new AppError(VALIDATION_MISSING_FIELD, 'You must be a creator to create posts', 403);
      }

      const post = await postService.create(creatorId, body);
      return successResponse(post, 'Post created successfully', 201);
    });
  },

  async getPost(postId: string, viewerId?: string) {
    return handleAsyncRoute(async () => {
      if (!postId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Post ID is required', 400);
      }
      const post = await postService.getById(postId, viewerId);
      if (!post) {
        throw new AppError(RESOURCE_NOT_FOUND, 'Post not found', 404);
      }
      return successResponse(post);
    });
  },

  async updatePost(postId: string, creatorId: string, body: UpdatePostInput) {
    return handleAsyncRoute(async () => {
      if (!postId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Post ID is required', 400);
      }
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const post = await postService.update(postId, creatorId, body);
      return successResponse(post);
    });
  },

  async updateMyPost(postId: string, userId: string, body: UpdatePostInput) {
    return handleAsyncRoute(async () => {
      if (!postId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Post ID is required', 400);
      }
      if (!userId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      }

      let creatorId: string;
      try {
        creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      } catch {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator profile not found', 403);
      }

      const post = await postService.update(postId, creatorId, body);
      return successResponse(post);
    });
  },

  async deletePost(postId: string, creatorId: string) {
    return handleAsyncRoute(async () => {
      if (!postId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Post ID is required', 400);
      }
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      await postService.delete(postId, creatorId);
      return successResponse({ success: true });
    });
  },

  async deleteMyPost(postId: string, userId: string) {
    return handleAsyncRoute(async () => {
      if (!postId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Post ID is required', 400);
      }
      if (!userId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      }
      let creatorId: string;
      try {
        creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      } catch {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator profile not found', 403);
      }
      await postService.delete(postId, creatorId);
      return successResponse({ success: true });
    });
  },

  async publishPost(postId: string, creatorId: string) {
    return handleAsyncRoute(async () => {
      if (!postId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Post ID is required', 400);
      }
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const post = await postService.publish(postId, creatorId);
      return successResponse(post);
    });
  },

  async publishMyPost(postId: string, userId: string) {
    return handleAsyncRoute(async () => {
      if (!postId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Post ID is required', 400);
      }
      if (!userId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      }
      let creatorId: string;
      try {
        creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      } catch {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator profile not found', 403);
      }
      const post = await postService.publish(postId, creatorId);
      return successResponse(post);
    });
  },

  async listCreatorPosts(
    creatorId: string,
    filters: { status?: string; cursor?: string; limit?: number }
  ) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const result = await postService.listByCreator(creatorId, {
        status: filters.status as 'draft' | 'published' | 'scheduled' | undefined,
        cursor: filters.cursor,
        limit: filters.limit,
      });
      return successResponse(result);
    });
  },

  async listMyPosts(userId: string, filters: { status?: string; cursor?: string; limit?: number }) {
    return handleAsyncRoute(async () => {
      if (!userId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      }
      let creatorId: string;
      try {
        creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      } catch {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator profile not found', 403);
      }
      const result = await postService.listByCreator(creatorId, {
        status: filters.status as 'draft' | 'published' | 'scheduled' | undefined,
        cursor: filters.cursor,
        limit: filters.limit,
      });
      return successResponse(result);
    });
  },

  // ============================================
  // MEDIA
  // ============================================

  async getUploadUrl(creatorId: string, file: FileMetadata) {
    try {
      const mediaType = mediaService.getMediaType(file.contentType);

      // Images, videos, and audio all use S3 presigned URLs (audio is MVP: no transcoding).
      if (mediaType === 'video') {
        const result = await mediaService.getVideoUploadUrl(creatorId, file);
        return successResponse(result);
      }

      if (mediaType === 'audio') {
        const result = await mediaService.getAudioUploadUrl(creatorId, file);
        return successResponse(result);
      }

      const result = await mediaService.getImageUploadUrl(creatorId, file);
      return successResponse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get upload URL';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async getUploadUrlForUser(userId: string, file: FileMetadata) {
    return handleAsyncRoute(async () => {
      if (!userId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      }
      let creatorId: string;
      try {
        creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      } catch {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator profile not found', 403);
      }
      return await this.getUploadUrl(creatorId, file);
    });
  },

  async confirmUpload(
    creatorId: string,
    body: { mediaId: string; key: string; width?: number; height?: number; mediaType?: string }
  ) {
    try {
      const result = await mediaService.confirmUpload(body.mediaId, creatorId, {
        key: body.key,
        width: body.width,
        height: body.height,
      });
      return successResponse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm upload';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async confirmUploadForUser(
    userId: string,
    body: { mediaId: string; key: string; width?: number; height?: number; mediaType?: string }
  ) {
    return handleAsyncRoute(async () => {
      if (!userId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      }
      let creatorId: string;
      try {
        creatorId = await creatorAccessService.requireCreatorIdByUserId(userId);
      } catch {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator profile not found', 403);
      }
      return this.confirmUpload(creatorId, body);
    });
  },

  async getMediaStatus(mediaId: string) {
    try {
      const status = await mediaService.getStatus(mediaId);
      return successResponse(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Media not found';
      return NextResponse.json({ error: { message } }, { status: 404 });
    }
  },

  // ============================================
  // FEED
  // ============================================

  async getSubscribedFeed(userId: string, cursor?: string, limit = 20) {
    return handleAsyncRoute(async () => {
      if (!userId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      }
      const feed = await feedService.getSubscribedFeed(userId, cursor, limit);
      return successResponse(feed);
    });
  },

  async getExploreFeed(cursor?: string, limit = 20, userId?: string) {
    return handleAsyncRoute(async () => {
      const feed = await feedService.getExploreFeed(cursor, limit, userId);
      return successResponse(feed);
    });
  },

  // ============================================
  // ENGAGEMENT
  // ============================================

  async toggleLike(postId: string, user: AuthUser) {
    try {
      requireEmailVerification(user);
      const isLiked = await likeRepo.toggle(user.id, postId);
      await postRepo.incrementLikeCount(postId, isLiked ? 1 : -1);
      return successResponse({ isLiked });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { message: error.message } },
          { status: error.statusCode }
        );
      }
      const message = error instanceof Error ? error.message : 'Failed to toggle like';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async toggleBookmark(postId: string, userId: string) {
    try {
      const isBookmarked = await bookmarkRepo.toggle(userId, postId);
      return successResponse({ isBookmarked });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle bookmark';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async getUserBookmarks(userId: string, cursor?: string, limit = 20) {
    try {
      const bookmarks = await bookmarkRepo.getUserBookmarks(userId, cursor, limit);
      const hasMore = bookmarks.length > limit;
      const items = hasMore ? bookmarks.slice(0, limit) : bookmarks;

      return successResponse({
        posts: items.map((b) => b.post),
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get bookmarks';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // COMMENTS
  // ============================================

  async getComments(postId: string, userId?: string, cursor?: string, limit = 20) {
    try {
      const comments = await commentService.getPostComments(postId, userId, cursor, limit);
      return successResponse(comments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get comments';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async createComment(postId: string, user: AuthUser, body: CreateCommentInput) {
    try {
      requireEmailVerification(user);
      const comment = await commentService.create(postId, user.id, body);
      return successResponse(comment, 'Comment created successfully', 201);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { message: error.message } },
          { status: error.statusCode }
        );
      }
      const message = error instanceof Error ? error.message : 'Failed to create comment';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async deleteComment(commentId: string, userId: string) {
    try {
      await commentService.delete(commentId, userId);
      return successResponse({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async toggleCommentLike(commentId: string, user: AuthUser) {
    try {
      requireEmailVerification(user);
      const isLiked = await commentService.toggleLike(commentId, user.id);
      return successResponse({ isLiked });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { error: { message: error.message } },
          { status: error.statusCode }
        );
      }
      const message = error instanceof Error ? error.message : 'Failed to toggle like';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // WEBHOOKS
  // ============================================

  async handleMuxWebhook(payload: unknown) {
    try {
      await mediaService.handleMuxWebhook(
        payload as Parameters<typeof mediaService.handleMuxWebhook>[0]
      );
      return successResponse({ received: true });
    } catch (error) {
      console.error('Mux webhook error:', error);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  },
};
