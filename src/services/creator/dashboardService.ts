import { prisma } from '@/lib/db/prisma';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { PayoutRepository } from '@/repositories/payoutRepository';
import type { DashboardMetrics } from '@/types/creator';

export class DashboardService {
  constructor(
    private readonly creatorRepo: CreatorRepository,

    private readonly payoutRepo: PayoutRepository
  ) {}

  /**
   * Get dashboard metrics for a creator
   */
  async getMetrics(
    userId: string,
    period: '7d' | '30d' | '90d' | 'all' = '30d'
  ): Promise<DashboardMetrics | null> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      return null;
    }

    // Calculate period start date
    const periodStart = this.getPeriodStart(period);

    // Get revenue for period
    const revenueResult = await prisma.transaction.aggregate({
      where: {
        creatorId: profile.id,
        status: 'completed',
        createdAt: periodStart ? { gte: periodStart } : undefined,
      },
      _sum: {
        creatorEarnings: true,
      },
    });

    // Get subscriber count
    const subscriberCount = await this.creatorRepo.getSubscriberCount(profile.id);

    // Get follower count
    const followerCount = await this.creatorRepo.getFollowerCount(profile.id);

    // Get profile views for period
    const viewsResult = await prisma.creatorAnalytics.aggregate({
      where: {
        creatorId: profile.id,
        date: periodStart ? { gte: periodStart } : undefined,
      },
      _sum: {
        profileViews: true,
      },
    });

    // Get pending payout
    const pendingPayout = await this.payoutRepo.getPendingAmount(profile.id);

    // Get next payout date
    const nextPayoutDate = this.payoutRepo.getNextPayoutDate();

    // Determine account status
    const isSquareConnected = Boolean(profile.stripeAccountId && profile.stripeOnboardingComplete);
    let accountStatus: DashboardMetrics['accountStatus'];

    if (profile.kycStatus !== 'approved') {
      accountStatus = 'pending_kyc';
    } else if (!isSquareConnected) {
      accountStatus = 'pending_payout_setup';
    } else {
      accountStatus = 'active';
    }

    return {
      totalRevenue: Number(revenueResult._sum.creatorEarnings ?? 0),
      subscriberCount,
      followerCount,
      profileViews: viewsResult._sum.profileViews ?? 0,
      pendingPayout,
      nextPayoutDate: nextPayoutDate.toISOString(),
      accountStatus,
    };
  }

  /**
   * Get earnings breakdown
   */
  async getEarningsBreakdown(userId: string, period: '7d' | '30d' | '90d' | 'all' = '30d') {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      return null;
    }

    const periodStart = this.getPeriodStart(period);

    // Get transactions grouped by type
    const transactions = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where: {
        creatorId: profile.id,
        status: 'completed',
        createdAt: periodStart ? { gte: periodStart } : undefined,
      },
      _sum: {
        creatorEarnings: true,
      },
      _count: true,
    });

    return transactions.map((t) => ({
      type: t.transactionType,
      total: Number(t._sum.creatorEarnings ?? 0),
      count: t._count,
    }));
  }

  private getPeriodStart(period: '7d' | '30d' | '90d' | 'all'): Date | null {
    if (period === 'all') return null;

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
