import { CommentRepository } from '@/repositories/commentRepository';
import { PostRepository } from '@/repositories/postRepository';
import type { CreateCommentInput, CommentWithUser, PaginatedComments } from '@/types/content';

import { PostService } from './postService';

export class CommentService {
  private commentRepo: CommentRepository;
  private postRepo: PostRepository;
  private postService: PostService;

  constructor() {
    this.commentRepo = new CommentRepository();
    this.postRepo = new PostRepository();
    this.postService = new PostService();
  }

  /**
   * Create a comment
   */
  async create(
    postId: string,
    userId: string,
    input: CreateCommentInput
  ): Promise<CommentWithUser> {
    // Check post exists and has comments enabled
    const post = await this.postRepo.findById(postId);
    if (!post) throw new Error('Post not found');
    if (!post.commentsEnabled) throw new Error('Comments are disabled for this post');

    // Check user has access to the post
    const access = await this.postService.checkAccess(postId, userId);
    if (!access.hasAccess) throw new Error('You must be subscribed to comment');

    // If replying, check parent exists
    if (input.parentId) {
      const parent = await this.commentRepo.findById(input.parentId);
      if (!parent || parent.postId !== postId) {
        throw new Error('Parent comment not found');
      }
    }

    // Create comment
    const comment = await this.commentRepo.create({
      postId,
      userId,
      content: input.content,
      parentId: input.parentId,
    });

    // Update counters
    await this.postRepo.incrementCommentCount(postId, 1);
    if (input.parentId) {
      await this.commentRepo.incrementReplyCount(input.parentId, 1);
    }

    return this.formatComment(comment);
  }

  /**
   * Delete a comment
   */
  async delete(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    // Only comment author or post creator can delete
    const post = await this.postRepo.findById(comment.postId);
    if (!post) throw new Error('Post not found');

    const isAuthor = comment.userId === userId;
    // Check if user is post creator (via their creator profile)
    const isPostCreator = false; // Would need to check creatorProfile.userId

    if (!isAuthor && !isPostCreator) {
      throw new Error('Unauthorized');
    }

    // Update counters
    await this.postRepo.incrementCommentCount(comment.postId, -1);
    if (comment.parentId) {
      await this.commentRepo.incrementReplyCount(comment.parentId, -1);
    }

    await this.commentRepo.delete(commentId);
  }

  /**
   * Get comments for a post
   */
  async getPostComments(
    postId: string,
    userId?: string,
    cursor?: string,
    limit = 20
  ): Promise<PaginatedComments> {
    const comments = await this.commentRepo.findByPostId(postId, cursor, limit);

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;

    // Format comments with first 3 replies
    const formatted = await Promise.all(
      items.map(async (c) => {
        const comment = this.formatComment(c);

        // Load first 3 replies
        if (c._count?.replies && c._count.replies > 0) {
          const replies = await this.commentRepo.findReplies(c.id, undefined, 3);
          comment.replies = replies.slice(0, 3).map((r) => this.formatComment(r));
        }

        // Add like status for logged in user
        if (userId) {
          comment.isLiked = await this.commentRepo.hasUserLiked(c.id, userId);
        }

        return comment;
      })
    );

    return {
      comments: formatted,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Get replies for a comment
   */
  async getReplies(
    commentId: string,
    userId?: string,
    cursor?: string,
    limit = 10
  ): Promise<PaginatedComments> {
    const replies = await this.commentRepo.findReplies(commentId, cursor, limit);

    const hasMore = replies.length > limit;
    const items = hasMore ? replies.slice(0, limit) : replies;

    const formatted = await Promise.all(
      items.map(async (r) => {
        const comment = this.formatComment(r);
        if (userId) {
          comment.isLiked = await this.commentRepo.hasUserLiked(r.id, userId);
        }
        return comment;
      })
    );

    return {
      comments: formatted,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Toggle like on comment
   */
  async toggleLike(commentId: string, userId: string): Promise<boolean> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    return this.commentRepo.toggleLike(commentId, userId);
  }

  /**
   * Hide comment (moderation)
   */
  async hide(commentId: string, hiddenByUserId: string, reason: string): Promise<void> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    // TODO: Check if user is creator of the post or admin
    await this.commentRepo.hide(commentId, hiddenByUserId, reason);
  }

  /**
   * Format comment for API response
   */
  private formatComment(
    comment: NonNullable<Awaited<ReturnType<CommentRepository['findById']>>>
  ): CommentWithUser {
    return {
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      parentId: comment.parentId,
      content: comment.content,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      isHidden: comment.isHidden,
      isPinned: comment.isPinned,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        displayName: comment.user.displayName,
        avatarUrl: comment.user.avatarUrl,
      },
    };
  }
}
