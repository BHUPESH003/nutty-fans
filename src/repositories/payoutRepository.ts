import { prisma } from '@/lib/db/prisma';

export class PayoutRepository {
  /**
   * Find payouts for a creator
   */
  async findByCreatorId(creatorId: string, limit = 20, offset = 0) {
    return prisma.payout.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get pending payout amount for creator
   */
  async getPendingAmount(creatorId: string): Promise<number> {
    const result = await prisma.transaction.aggregate({
      where: {
        creatorId,
        status: 'completed',
        // Not yet paid out - check if there's no associated payout
        // For now, use a simpler approach: sum all completed earnings
      },
      _sum: {
        creatorEarnings: true,
      },
    });

    // Get total already paid out
    const paidOut = await prisma.payout.aggregate({
      where: {
        creatorId,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    const totalEarnings = Number(result._sum.creatorEarnings ?? 0);
    const totalPaidOut = Number(paidOut._sum.amount ?? 0);

    return Math.max(0, totalEarnings - totalPaidOut);
  }

  /**
   * Create a payout record
   */
  async create(data: {
    creatorId: string;
    amount: number;
    periodStart: Date;
    periodEnd: Date;
    squarePayoutId?: string;
  }) {
    return prisma.payout.create({
      data: {
        creatorId: data.creatorId,
        amount: data.amount,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        status: 'pending',
        payoutMethod: 'square',
        stripePayoutId: data.squarePayoutId,
      },
    });
  }

  /**
   * Update payout status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    processedAt?: Date
  ) {
    return prisma.payout.update({
      where: { id },
      data: {
        status,
        processedAt: processedAt ?? (status === 'completed' ? new Date() : undefined),
      },
    });
  }

  /**
   * Get next payout date (next Friday)
   */
  getNextPayoutDate(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + daysUntilFriday);
    nextFriday.setHours(0, 0, 0, 0);
    return nextFriday;
  }
}
