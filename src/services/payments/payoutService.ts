import { prisma } from '@/lib/db/prisma';
import { PayoutRepository } from '@/repositories/payoutRepository';
import { TransactionRepository } from '@/repositories/transactionRepository';
import type { EarningsSummary, PaginatedPayouts, PayoutSettings } from '@/types/payments';
import { MINIMUM_PAYOUT_AMOUNT } from '@/types/payments';

export class PayoutService {
  private payoutRepo: PayoutRepository;
  private transactionRepo: TransactionRepository;

  constructor() {
    this.payoutRepo = new PayoutRepository();
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Get earnings summary for creator
   */
  async getEarningsSummary(creatorId: string): Promise<EarningsSummary> {
    // Total completed earnings
    const allTime = await this.transactionRepo.getEarningsSummary(creatorId);

    // Total paid out
    const totalPaidOut = await prisma.payout.aggregate({
      where: { creatorId, status: 'completed' },
      _sum: { amount: true },
    });

    const pendingPayout = allTime.totalEarnings - (totalPaidOut._sum.amount?.toNumber() ?? 0);

    return {
      totalEarnings: allTime.totalEarnings,
      pendingPayout: Math.max(0, pendingPayout),
      lifetimeEarnings: allTime.totalEarnings,
      transactionCount: allTime.transactionCount,
      byType: allTime.byType,
    };
  }

  /**
   * Get payout history
   */
  async getPayouts(creatorId: string, cursor?: string, limit = 20): Promise<PaginatedPayouts> {
    const payouts = await this.payoutRepo.findByCreatorId(creatorId, limit + 1, 0);
    const hasMore = payouts.length > limit;
    const items = hasMore ? payouts.slice(0, limit) : payouts;

    return {
      payouts: items.map((p) => ({
        id: p.id,
        creatorId: p.creatorId,
        amount: p.amount.toNumber(),
        currency: p.currency,
        status: p.status,
        payoutMethod: p.payoutMethod,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        transactionsCount: p.transactionsCount,
        failureReason: p.failureReason,
        processedAt: p.processedAt,
        createdAt: p.createdAt,
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Create payout (called by cron job)
   */
  async createPayout(creatorId: string): Promise<{ id: string; amount: number } | null> {
    const pendingAmount = await this.payoutRepo.getPendingAmount(creatorId);

    if (pendingAmount < MINIMUM_PAYOUT_AMOUNT) {
      return null; // Below minimum
    }

    const lastPayout = await prisma.payout.findFirst({
      where: { creatorId, status: 'completed' },
      orderBy: { periodEnd: 'desc' },
    });

    const periodStart = lastPayout?.periodEnd ?? new Date(0);
    const periodEnd = new Date();

    // Count transactions in period
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _transactionCount = await prisma.transaction.count({
      // eslint-disable-line no-unused-vars
      where: {
        creatorId,
        status: 'completed',
        createdAt: { gt: periodStart, lte: periodEnd },
      },
    });

    const payout = await this.payoutRepo.create({
      creatorId,
      amount: pendingAmount,
      periodStart,
      periodEnd,
    });

    return { id: payout.id, amount: pendingAmount };
  }

  /**
   * Get payout settings
   */
  async getSettings(_creatorId: string): Promise<PayoutSettings> {
    // eslint-disable-line no-unused-vars
    // For now, return defaults
    return {
      minimumAmount: MINIMUM_PAYOUT_AMOUNT,
      autoPayoutEnabled: true,
      payoutDay: 'friday',
    };
  }

  /**
   * Get next payout date
   */
  getNextPayoutDate(): Date {
    return this.payoutRepo.getNextPayoutDate();
  }
}
