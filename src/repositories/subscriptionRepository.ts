import { prisma } from '@/lib/db/prisma';
import type { SubscriptionPlanType, SubscriptionStatus } from '@/types/payments';
import { PLAN_MONTHS } from '@/types/payments';

export class SubscriptionRepository {
  /**
   * Create subscription
   */
  async create(data: {
    userId: string;
    creatorId: string;
    planType: SubscriptionPlanType;
    pricePaid: number;
    autoRenew?: boolean;
  }) {
    const months = PLAN_MONTHS[data.planType];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    return prisma.subscription.create({
      data: {
        userId: data.userId,
        creatorId: data.creatorId,
        planType: data.planType as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        pricePaid: data.pricePaid,
        status: 'active',
        expiresAt,
        autoRenew: data.autoRenew ?? true,
      },
      include: {
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find by ID
   */
  async findById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: {
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find active subscription between user and creator
   */
  async findActive(userId: string, creatorId: string) {
    return prisma.subscription.findFirst({
      where: {
        userId,
        creatorId,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Check if user is subscribed to creator
   */
  async isSubscribed(userId: string, creatorId: string): Promise<boolean> {
    const sub = await this.findActive(userId, creatorId);
    return !!sub;
  }

  /**
   * Get user's subscriptions
   */
  async findByUser(userId: string, status?: SubscriptionStatus, cursor?: string, limit = 20) {
    return prisma.subscription.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get creator's subscribers
   */
  async findByCreator(creatorId: string, status?: SubscriptionStatus, cursor?: string, limit = 20) {
    return prisma.subscription.findMany({
      where: {
        creatorId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
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
   * Update subscription status
   */
  async updateStatus(id: string, status: SubscriptionStatus) {
    return prisma.subscription.update({
      where: { id },
      data: {
        status,
        ...(status === 'cancelled' && { cancelledAt: new Date() }),
      },
    });
  }

  /**
   * Renew subscription
   */
  async renew(id: string, planType: SubscriptionPlanType, pricePaid: number) {
    const months = PLAN_MONTHS[planType];
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    return prisma.subscription.update({
      where: { id },
      data: {
        planType: planType as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        pricePaid,
        status: 'active',
        expiresAt,
        cancelledAt: null,
      },
      include: {
        creator: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * Toggle auto-renew
   */
  async setAutoRenew(id: string, autoRenew: boolean) {
    return prisma.subscription.update({
      where: { id },
      data: { autoRenew },
    });
  }

  /**
   * Get expiring subscriptions (for renewal reminders)
   */
  async findExpiringSoon(daysAhead: number) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.subscription.findMany({
      where: {
        status: 'active',
        autoRenew: true,
        expiresAt: {
          gt: new Date(),
          lte: futureDate,
        },
      },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        creator: { include: { user: { select: { displayName: true } } } },
      },
    });
  }

  /**
   * Count active subscribers for creator
   */
  async countActiveSubscribers(creatorId: string): Promise<number> {
    return prisma.subscription.count({
      where: {
        creatorId,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Add subscription history event
   */
  async addHistoryEvent(data: {
    subscriptionId: string;
    userId: string;
    creatorId: string;
    eventType: 'created' | 'renewed' | 'cancelled' | 'expired' | 'upgraded' | 'downgraded';
    planType?: string;
    pricePaid?: number;
    previousPlan?: string;
  }) {
    return prisma.subscriptionHistory.create({
      data: {
        subscriptionId: data.subscriptionId,
        userId: data.userId,
        creatorId: data.creatorId,
        eventType: data.eventType,
        planType: data.planType,
        pricePaid: data.pricePaid,
        previousPlan: data.previousPlan,
      },
    });
  }
}
