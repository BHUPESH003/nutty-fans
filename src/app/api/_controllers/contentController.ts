import { NextResponse } from 'next/server';

import { BookmarkRepository } from '@/repositories/bookmarkRepository';
import { LikeRepository } from '@/repositories/likeRepository';
import { PostRepository } from '@/repositories/postRepository';
import { CommentService } from '@/services/content/commentService';
import { FeedService } from '@/services/content/feedService';
import { MediaService } from '@/services/content/mediaService';
import { PostService } from '@/services/content/postService';
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

export const contentController = {
  // ============================================
  // POST CRUD
  // ============================================

  async createPost(creatorId: string, body: CreatePostInput) {
    try {
      const post = await postService.create(creatorId, body);
      return NextResponse.json(post, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create post';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async getPost(postId: string, viewerId?: string) {
    try {
      const post = await postService.getById(postId, viewerId);
      if (!post) {
        return NextResponse.json({ error: { message: 'Post not found' } }, { status: 404 });
      }
      return NextResponse.json(post);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get post';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async updatePost(postId: string, creatorId: string, body: UpdatePostInput) {
    try {
      const post = await postService.update(postId, creatorId, body);
      return NextResponse.json(post);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update post';
      const status = message === 'Unauthorized' ? 403 : message === 'Post not found' ? 404 : 400;
      return NextResponse.json({ error: { message } }, { status });
    }
  },

  async deletePost(postId: string, creatorId: string) {
    try {
      await postService.delete(postId, creatorId);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete post';
      const status = message === 'Unauthorized' ? 403 : message === 'Post not found' ? 404 : 400;
      return NextResponse.json({ error: { message } }, { status });
    }
  },

  async publishPost(postId: string, creatorId: string) {
    try {
      const post = await postService.publish(postId, creatorId);
      return NextResponse.json(post);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish post';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async listCreatorPosts(
    creatorId: string,
    filters: { status?: string; cursor?: string; limit?: number }
  ) {
    try {
      const result = await postService.listByCreator(creatorId, {
        status: filters.status as 'draft' | 'published' | 'scheduled' | undefined,
        cursor: filters.cursor,
        limit: filters.limit,
      });
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list posts';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // MEDIA
  // ============================================

  async getUploadUrl(creatorId: string, file: FileMetadata) {
    try {
      const mediaType = mediaService.getMediaType(file.contentType);

      if (mediaType === 'video') {
        const result = await mediaService.getVideoUploadUrl(creatorId, file);
        return NextResponse.json(result);
      } else {
        const result = await mediaService.getImageUploadUrl(creatorId, file);
        return NextResponse.json(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get upload URL';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async confirmUpload(
    creatorId: string,
    body: { mediaId: string; key: string; width?: number; height?: number }
  ) {
    try {
      const media = await mediaService.confirmImageUpload(body.mediaId, creatorId, {
        key: body.key,
        width: body.width,
        height: body.height,
      });
      return NextResponse.json(media);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to confirm upload';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async getMediaStatus(mediaId: string) {
    try {
      const status = await mediaService.getStatus(mediaId);
      return NextResponse.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Media not found';
      return NextResponse.json({ error: { message } }, { status: 404 });
    }
  },

  // ============================================
  // FEED
  // ============================================

  async getSubscribedFeed(userId: string, cursor?: string, limit = 20) {
    try {
      const feed = await feedService.getSubscribedFeed(userId, cursor, limit);
      return NextResponse.json(feed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get feed';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async getExploreFeed(cursor?: string, limit = 20, userId?: string) {
    try {
      const feed = await feedService.getExploreFeed(cursor, limit, userId);
      return NextResponse.json(feed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get explore feed';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // ENGAGEMENT
  // ============================================

  async toggleLike(postId: string, userId: string) {
    try {
      const isLiked = await likeRepo.toggle(userId, postId);
      await postRepo.incrementLikeCount(postId, isLiked ? 1 : -1);
      return NextResponse.json({ isLiked });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle like';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async toggleBookmark(postId: string, userId: string) {
    try {
      const isBookmarked = await bookmarkRepo.toggle(userId, postId);
      return NextResponse.json({ isBookmarked });
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

      return NextResponse.json({
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
      return NextResponse.json(comments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get comments';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async createComment(postId: string, userId: string, body: CreateCommentInput) {
    try {
      const comment = await commentService.create(postId, userId, body);
      return NextResponse.json(comment, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create comment';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async deleteComment(commentId: string, userId: string) {
    try {
      await commentService.delete(commentId, userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async toggleCommentLike(commentId: string, userId: string) {
    try {
      const isLiked = await commentService.toggleLike(commentId, userId);
      return NextResponse.json({ isLiked });
    } catch (error) {
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
      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Mux webhook error:', error);
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
  },
};
