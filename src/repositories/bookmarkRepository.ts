import { prisma } from '@/lib/db/prisma';

export class BookmarkRepository {
  /**
   * Check if user has bookmarked a post
   */
  async exists(userId: string, postId: string): Promise<boolean> {
    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!bookmark;
  }

  /**
   * Create bookmark
   */
  async create(userId: string, postId: string) {
    return prisma.bookmark.create({
      data: { userId, postId },
    });
  }

  /**
   * Delete bookmark
   */
  async delete(userId: string, postId: string) {
    return prisma.bookmark.delete({
      where: { userId_postId: { userId, postId } },
    });
  }

  /**
   * Toggle bookmark (create or delete)
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
   * Get bookmarked post IDs for user
   */
  async getBookmarkedPostIds(userId: string, postIds: string[]): Promise<string[]> {
    const bookmarks = await prisma.bookmark.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });
    return bookmarks.map((b) => b.postId);
  }

  /**
   * Get user's bookmarked posts (paginated)
   */
  async getUserBookmarks(userId: string, cursor?: string, limit = 20) {
    return prisma.bookmark.findMany({
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
