import { prisma } from '@/lib/db/prisma';

export class BundlePurchaseRepository {
  async hasPurchasedBundle(userId: string, bundleId: string): Promise<boolean> {
    const row = await prisma.bundlePurchase.findUnique({
      where: { bundleId_userId: { bundleId, userId } },
      select: { id: true },
    });
    return !!row;
  }

  async create(data: {
    bundleId: string;
    userId: string;
    transactionId: string;
    pricePaid: number;
  }) {
    return prisma.bundlePurchase.create({
      data: {
        bundleId: data.bundleId,
        userId: data.userId,
        transactionId: data.transactionId,
        pricePaid: data.pricePaid,
      },
    });
  }

  async listByUser(userId: string, cursor?: string, limit = 20) {
    return prisma.bundlePurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        bundle: {
          select: {
            id: true,
            title: true,
            coverImageUrl: true,
            creator: {
              include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
            },
          },
        },
      },
    });
  }

  /**
   * Check if user has purchased a bundle that contains a given post
   */
  async hasPurchasedPost(userId: string, postId: string): Promise<boolean> {
    const row = await prisma.bundleItem.findFirst({
      where: {
        postId,
        bundle: { purchases: { some: { userId } }, status: 'active' },
      },
      select: { id: true },
    });
    return !!row;
  }

  /**
   * Get post IDs the user has access to via bundle purchases.
   */
  async getPurchasedPostIds(userId: string, postIds: string[]): Promise<string[]> {
    if (postIds.length === 0) return [];

    const rows = await prisma.bundleItem.findMany({
      where: {
        postId: { in: postIds },
        bundle: { purchases: { some: { userId } }, status: 'active' },
      },
      select: { postId: true },
    });

    return Array.from(new Set(rows.map((r) => r.postId)));
  }
}
