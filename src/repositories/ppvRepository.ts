import { prisma } from '@/lib/db/prisma';

export class PpvRepository {
  /**
   * Create PPV purchase record
   */
  async create(data: { userId: string; postId: string; transactionId: string; pricePaid: number }) {
    return prisma.ppvPurchase.create({
      data: {
        userId: data.userId,
        postId: data.postId,
        transactionId: data.transactionId,
        pricePaid: data.pricePaid,
      },
    });
  }

  /**
   * Check if user has purchased post
   */
  async hasPurchased(userId: string, postId: string): Promise<boolean> {
    const purchase = await prisma.ppvPurchase.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!purchase;
  }

  /**
   * Get user's PPV purchases
   */
  async findByUser(userId: string, cursor?: string, limit = 20) {
    return prisma.ppvPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        post: {
          select: {
            id: true,
            content: true,
            media: {
              take: 1,
              select: { thumbnailUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get purchase by transaction ID
   */
  async findByTransactionId(transactionId: string) {
    return prisma.ppvPurchase.findFirst({
      where: { transactionId },
    });
  }
}
