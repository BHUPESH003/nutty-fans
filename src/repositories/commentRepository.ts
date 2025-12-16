import { prisma } from '@/lib/db/prisma';

export class CommentRepository {
  /**
   * Create comment
   */
  async create(data: { postId: string; userId: string; content: string; parentId?: string }) {
    return prisma.comment.create({
      data: {
        postId: data.postId,
        userId: data.userId,
        content: data.content,
        parentId: data.parentId ?? null,
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Find comment by ID
   */
  async findById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Get top-level comments for post
   */
  async findByPostId(postId: string, cursor?: string, limit = 20) {
    return prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Top-level only
        isHidden: false,
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  /**
   * Get replies for a comment
   */
  async findReplies(commentId: string, cursor?: string, limit = 10) {
    return prisma.comment.findMany({
      where: {
        parentId: commentId,
        isHidden: false,
      },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Delete comment
   */
  async delete(id: string) {
    return prisma.comment.delete({
      where: { id },
    });
  }

  /**
   * Hide comment (moderation)
   */
  async hide(id: string, hiddenBy: string, reason: string) {
    return prisma.comment.update({
      where: { id },
      data: {
        isHidden: true,
        hiddenBy,
        hiddenReason: reason,
        hiddenAt: new Date(),
      },
    });
  }

  /**
   * Pin/unpin comment
   */
  async togglePin(id: string, isPinned: boolean) {
    return prisma.comment.update({
      where: { id },
      data: { isPinned },
    });
  }

  /**
   * Increment like count
   */
  async incrementLikeCount(id: string, delta: number) {
    return prisma.comment.update({
      where: { id },
      data: { likeCount: { increment: delta } },
    });
  }

  /**
   * Increment reply count on parent
   */
  async incrementReplyCount(id: string, delta: number) {
    return prisma.comment.update({
      where: { id },
      data: { replyCount: { increment: delta } },
    });
  }

  /**
   * Check if user liked comment
   */
  async hasUserLiked(commentId: string, userId: string): Promise<boolean> {
    const like = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });
    return !!like;
  }

  /**
   * Toggle comment like
   */
  async toggleLike(commentId: string, userId: string): Promise<boolean> {
    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await prisma.commentLike.delete({
        where: { commentId_userId: { commentId, userId } },
      });
      await this.incrementLikeCount(commentId, -1);
      return false;
    } else {
      await prisma.commentLike.create({
        data: { commentId, userId },
      });
      await this.incrementLikeCount(commentId, 1);
      return true;
    }
  }
}
