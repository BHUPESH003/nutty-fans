import { prisma } from '@/lib/db/prisma';

export class LikeRepository {
  /**
   * Check if user has liked a post
   */
  async exists(userId: string, postId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!like;
  }

  /**
   * Create like
   */
  async create(userId: string, postId: string) {
    return prisma.like.create({
      data: { userId, postId },
    });
  }

  /**
   * Delete like
   */
  async delete(userId: string, postId: string) {
    return prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });
  }

  /**
   * Toggle like (create or delete)
   */
  async toggle(userId: string, postId: string): Promise<boolean> {
    const exists = await this.exists(userId, postId);

    if (exists) {
      await this.delete(userId, postId);
      return false;
    } else {
      await this.create(userId, postId);
      return true;
    }
  }

  /**
   * Get liked post IDs for user
   */
  async getLikedPostIds(userId: string, postIds: string[]): Promise<string[]> {
    const likes = await prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });
    return likes.map((l) => l.postId);
  }

  /**
   * Get user's liked posts (paginated)
   */
  async getUserLikedPosts(userId: string, cursor?: string, limit = 20) {
    return prisma.like.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        post: {
          include: {
            media: { orderBy: { sortOrder: 'asc' } },
            creator: {
              include: {
                user: {
                  select: { id: true, username: true, displayName: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
    });
  }
}
