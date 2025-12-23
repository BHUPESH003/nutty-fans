/**
 * Subscription Service
 *
 * Handles creator subscriptions.
 * All payments go through PaymentService.debitWallet()
 *
 * CLOSED-LOOP WALLET:
 * - No card payments - wallet only
 * - Auto top-up available for renewals (opt-in)
 * - Grace period on failed renewals
 */

import { prisma } from '@/lib/db/prisma';
import { SubscriptionRepository } from '@/repositories/subscriptionRepository';
import { transactionService } from '@/services/finance/transactionService';
import type {
  SubscriptionPlanType,
  SubscriptionPlan,
  SubscriptionWithCreator,
  PaginatedSubscriptions,
} from '@/types/payments';
import { PLAN_DISCOUNTS, PLAN_MONTHS } from '@/types/payments';

import { paymentService, SUBSCRIPTION_GRACE_PERIOD_DAYS } from './paymentService';

export class SubscriptionService {
  private subscriptionRepo: SubscriptionRepository;

  constructor() {
    this.subscriptionRepo = new SubscriptionRepository();
  }

  /**
   * Get subscription plans for a creator
   */
  async getPlans(creatorId: string): Promise<SubscriptionPlan[]> {
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
   * Debits wallet - no card option
   */
  async subscribe(
    userId: string,
    creatorId: string,
    planType: SubscriptionPlanType = 'monthly'
  ): Promise<{
    subscription: SubscriptionWithCreator;
    transactionId: string;
  }> {
    // Check if already subscribed
    const existing = await this.subscriptionRepo.findActive(userId, creatorId);
    if (existing) {
      throw new Error('Already subscribed to this creator');
    }

    // Get pricing
    const plans = await this.getPlans(creatorId);
    const plan = plans.find((p) => p.planType === planType);
    if (!plan) throw new Error('Invalid plan type');

    // Debit wallet (single payment path)
    const result = await paymentService.debitWallet(userId, {
      transactionType: 'subscription',
      amount: plan.finalPrice,
      creatorId,
      relatedType: 'subscription',
      description: `${planType} subscription`,
    });

    // Create subscription
    const subscription = await this.subscriptionRepo.create({
      userId,
      creatorId,
      planType,
      pricePaid: plan.finalPrice,
      autoRenew: true,
    });

    // Update transaction with subscription ID
    await prisma.transaction.update({
      where: { id: result.transactionId },
      data: { relatedId: subscription.id },
    });

    // Increment subscriber count
    await transactionService.incrementSubscriberCount(creatorId);

    // Record history
    await this.subscriptionRepo.addHistoryEvent({
      subscriptionId: subscription.id,
      userId,
      creatorId,
      eventType: 'created',
      planType,
      pricePaid: plan.finalPrice,
    });

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscription: this.formatSubscription(subscription as any),
      transactionId: result.transactionId,
    };
  }

  /**
   * Process subscription renewal (called by scheduled job)
   * Implements auto top-up and grace period logic
   */
  async processRenewal(subscriptionId: string): Promise<{
    success: boolean;
    error?: string;
    inGracePeriod?: boolean;
  }> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) {
      return { success: false, error: 'Subscription not found' };
    }

    if (subscription.status !== 'active' || !subscription.autoRenew) {
      return { success: false, error: 'Subscription not eligible for renewal' };
    }

    // Get pricing
    const plans = await this.getPlans(subscription.creatorId);
    const plan = plans.find((p) => p.planType === subscription.planType);
    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    const userId = subscription.userId;
    const requiredAmount = plan.finalPrice;

    // Check wallet balance
    const balance = await paymentService.getWalletBalance(userId);

    if (balance >= requiredAmount) {
      // Sufficient balance - debit wallet
      try {
        await paymentService.debitWallet(userId, {
          transactionType: 'subscription',
          amount: requiredAmount,
          creatorId: subscription.creatorId,
          relatedId: subscriptionId,
          relatedType: 'subscription',
          description: `${subscription.planType} subscription renewal`,
        });

        // Extend subscription
        await this.subscriptionRepo.renew(
          subscriptionId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subscription.planType as any,
          requiredAmount
        );

        await this.subscriptionRepo.addHistoryEvent({
          subscriptionId,
          userId,
          creatorId: subscription.creatorId,
          eventType: 'renewed',
          planType: subscription.planType,
          pricePaid: requiredAmount,
        });

        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Debit failed' };
      }
    }

    // Insufficient balance - try auto top-up
    const topUpResult = await paymentService.attemptAutoTopUp(userId, requiredAmount);

    if (topUpResult.success) {
      // Auto top-up succeeded, retry debit
      try {
        await paymentService.debitWallet(userId, {
          transactionType: 'subscription',
          amount: requiredAmount,
          creatorId: subscription.creatorId,
          relatedId: subscriptionId,
          relatedType: 'subscription',
          description: `${subscription.planType} subscription renewal (auto top-up)`,
        });

        await this.subscriptionRepo.renew(
          subscriptionId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subscription.planType as any,
          requiredAmount
        );

        await this.subscriptionRepo.addHistoryEvent({
          subscriptionId,
          userId,
          creatorId: subscription.creatorId,
          eventType: 'renewed',
          planType: subscription.planType,
          pricePaid: requiredAmount,
        });

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Debit failed after top-up',
        };
      }
    }

    // Auto top-up failed or not enabled - enter grace period
    await this.enterGracePeriod(subscriptionId, userId, subscription.creatorId);
    return { success: false, error: topUpResult.error, inGracePeriod: true };
  }

  /**
   * Enter grace period for failed renewal
   */
  private async enterGracePeriod(
    subscriptionId: string,
    userId: string,
    creatorId: string
  ): Promise<void> {
    // Update subscription status to paused
    await this.subscriptionRepo.updateStatus(subscriptionId, 'paused');

    // Extend expiration by grace period
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + SUBSCRIPTION_GRACE_PERIOD_DAYS);

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        expiresAt: graceEnd,
        metadata: {
          gracePeriodStart: new Date().toISOString(),
          gracePeriodEnd: graceEnd.toISOString(),
        },
      },
    });

    await this.subscriptionRepo.addHistoryEvent({
      subscriptionId,
      userId,
      creatorId,
      eventType: 'renewed' as never, // grace_period_started not in type
    });

    // TODO: Send notification to user about grace period
  }

  /**
   * Process expired grace period (called by scheduled job)
   */
  async expireGracePeriod(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription || subscription.status !== 'paused') return;

    // Cancel subscription
    await this.subscriptionRepo.updateStatus(subscriptionId, 'expired');

    // Decrement subscriber count
    await transactionService.decrementSubscriberCount(subscription.creatorId);

    await this.subscriptionRepo.addHistoryEvent({
      subscriptionId,
      userId: subscription.userId,
      creatorId: subscription.creatorId,
      eventType: 'expired',
    });

    // TODO: Send notification to user about expiration
  }

  /**
   * Cancel subscription
   */
  async cancel(subscriptionId: string, userId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');
    if (subscription.userId !== userId) throw new Error('Unauthorized');
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      throw new Error('Subscription is not active');
    }

    await this.subscriptionRepo.updateStatus(subscriptionId, 'cancelled');

    // Decrement subscriber count
    await transactionService.decrementSubscriberCount(subscription.creatorId);

    await this.subscriptionRepo.addHistoryEvent({
      subscriptionId,
      userId,
      creatorId: subscription.creatorId,
      eventType: 'cancelled',
    });
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
