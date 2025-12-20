import { prisma } from '@/lib/db/prisma';
import { SubscriptionRepository } from '@/repositories/subscriptionRepository';
import { TransactionRepository } from '@/repositories/transactionRepository';
import type {
  SubscriptionPlanType,
  SubscriptionPlan,
  SubscribeInput,
  SubscriptionWithCreator,
  PaginatedSubscriptions,
} from '@/types/payments';
import { PLAN_DISCOUNTS, PLAN_MONTHS } from '@/types/payments';

export class SubscriptionService {
  private subscriptionRepo: SubscriptionRepository;
  private transactionRepo: TransactionRepository;

  constructor() {
    this.subscriptionRepo = new SubscriptionRepository();
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Get subscription plans for a creator
   */
  async getPlans(creatorId: string): Promise<SubscriptionPlan[]> {
    // Get creator's base price
    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { subscriptionPrice: true },
    });

    if (!creator) throw new Error('Creator not found');

    const basePrice = creator.subscriptionPrice?.toNumber() ?? 9.99;

    return (Object.keys(PLAN_DISCOUNTS) as SubscriptionPlanType[]).map((planType) => {
      const discount = PLAN_DISCOUNTS[planType];
      const months = PLAN_MONTHS[planType];
      const totalBeforeDiscount = basePrice * months;
      const discountAmount = totalBeforeDiscount * discount;
      const finalPrice = totalBeforeDiscount - discountAmount;

      return {
        planType,
        months,
        basePrice,
        discount,
        finalPrice: Math.round(finalPrice * 100) / 100,
      };
    });
  }

  /**
   * Subscribe to a creator
   */
  async subscribe(
    userId: string,
    creatorId: string,
    input: SubscribeInput = {}
  ): Promise<{
    subscription: SubscriptionWithCreator;
    checkoutUrl?: string;
    transactionId: string;
  }> {
    const planType = input.planType ?? 'monthly';

    // Check if already subscribed
    const existing = await this.subscriptionRepo.findActive(userId, creatorId);
    if (existing) {
      throw new Error('Already subscribed to this creator');
    }

    // Get pricing
    const plans = await this.getPlans(creatorId);
    const plan = plans.find((p) => p.planType === planType);
    if (!plan) throw new Error('Invalid plan type');

    // Create pending transaction
    const transaction = await this.transactionRepo.create({
      userId,
      creatorId,
      transactionType: 'subscription',
      amount: plan.finalPrice,
      relatedType: 'subscription',
      description: `${planType} subscription`,
    });

    // Create subscription (status: active after payment)
    const subscription = await this.subscriptionRepo.create({
      userId,
      creatorId,
      planType,
      pricePaid: plan.finalPrice,
      autoRenew: true,
    });

    // Record history
    await this.subscriptionRepo.addHistoryEvent({
      subscriptionId: subscription.id,
      userId,
      creatorId,
      eventType: 'created',
      planType,
      pricePaid: plan.finalPrice,
    });

    // Update transaction with subscription ID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { relatedId: subscription.id },
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscription: this.formatSubscription(subscription as any),
      transactionId: transaction.id,
    };
  }

  /**
   * Cancel subscription
   */
  async cancel(subscriptionId: string, userId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    if (subscription.userId !== userId) throw new Error('Unauthorized');
    if (subscription.status !== 'active') throw new Error('Subscription is not active');

    await this.subscriptionRepo.updateStatus(subscriptionId, 'cancelled');

    await this.subscriptionRepo.addHistoryEvent({
      subscriptionId,
      userId,
      creatorId: subscription.creatorId,
      eventType: 'cancelled',
    });
  }

  /**
   * Renew subscription
   */
  async renew(
    subscriptionId: string,
    planType?: SubscriptionPlanType
  ): Promise<SubscriptionWithCreator> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const newPlanType = planType ?? subscription.planType;
    const plans = await this.getPlans(subscription.creatorId);
    const plan = plans.find((p) => p.planType === newPlanType);
    if (!plan) throw new Error('Invalid plan type');

    // Create transaction
    await this.transactionRepo.create({
      userId: subscription.userId,
      creatorId: subscription.creatorId,
      transactionType: 'subscription',
      amount: plan.finalPrice,
      relatedType: 'subscription',
      relatedId: subscriptionId,
      description: `${newPlanType} subscription renewal`,
    });

    const renewed = await this.subscriptionRepo.renew(
      subscriptionId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      newPlanType as any,
      plan.finalPrice
    );

    await this.subscriptionRepo.addHistoryEvent({
      subscriptionId,
      userId: subscription.userId,
      creatorId: subscription.creatorId,
      eventType: 'renewed',
      planType: newPlanType,
      pricePaid: plan.finalPrice,
    });

    return this.formatSubscription(renewed);
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(
    userId: string,
    cursor?: string,
    limit = 20
  ): Promise<PaginatedSubscriptions> {
    const subscriptions = await this.subscriptionRepo.findByUser(userId, undefined, cursor, limit);
    const hasMore = subscriptions.length > limit;
    const items = hasMore ? subscriptions.slice(0, limit) : subscriptions;

    return {
      subscriptions: items.map((s) => this.formatSubscription(s)),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Get creator's subscribers
   */
  async getCreatorSubscribers(creatorId: string, cursor?: string, limit = 20) {
    const subscribers = await this.subscriptionRepo.findByCreator(
      creatorId,
      'active',
      cursor,
      limit
    );
    const hasMore = subscribers.length > limit;
    const items = hasMore ? subscribers.slice(0, limit) : subscribers;

    return {
      subscribers: items.map((s) => ({
        id: s.id,
        planType: s.planType,
        startedAt: s.startedAt,
        expiresAt: s.expiresAt,
        user: s.user,
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
      totalCount: await this.subscriptionRepo.countActiveSubscribers(creatorId),
    };
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(userId: string, creatorId: string): Promise<boolean> {
    return this.subscriptionRepo.isSubscribed(userId, creatorId);
  }

  /**
   * Format subscription for API response
   */
  private formatSubscription(
    sub: NonNullable<Awaited<ReturnType<SubscriptionRepository['findById']>>>
  ): SubscriptionWithCreator {
    const creator = sub.creator;
    const user = creator.user;

    return {
      id: sub.id,
      userId: sub.userId,
      creatorId: sub.creatorId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      planType: sub.planType as any,
      pricePaid: sub.pricePaid.toNumber(),
      status: sub.status,
      startedAt: sub.startedAt,
      expiresAt: sub.expiresAt,
      cancelledAt: sub.cancelledAt,
      autoRenew: sub.autoRenew,
      creator: {
        id: creator.id,
        handle: user.username ?? 'user',
        displayName: user.displayName ?? 'User',
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
