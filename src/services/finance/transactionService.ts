import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { commissionService, type CommissionResult } from '@/services/finance/commissionService';

/**
 * Input for creating a transaction with automatic commission calculation
 */
export interface CreateTransactionInput {
  userId: string;
  creatorId?: string;
  transactionType: TransactionType;
  amount: number;
  relatedId?: string;
  relatedType?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Options for transaction creation
 */
export interface TransactionOptions {
  /** Skip commission calculation (e.g., for wallet top-ups) */
  skipCommission?: boolean;
  /** Initial status (default: pending) */
  status?: TransactionStatus;
  /** Stripe payment ID if already processed */
  stripePaymentId?: string;
}

/**
 * Result of transaction creation with commission details
 */
export interface TransactionResult {
  transactionId: string;
  amount: number;
  platformFee: number | null;
  creatorEarnings: number | null;
  commissionRatePercent: number | null;
  subscriberCountAtTime: number | null;
  status: TransactionStatus;
}

/**
 * Unified Transaction Service
 *
 * Single source of truth for all transaction operations.
 * Automatically calculates commission using progressive tier system.
 * Handles subscriber count updates for subscription events.
 *
 * Use this service in all features that create transactions:
 * - Subscriptions
 * - Tips
 * - PPV (Pay Per View)
 * - Chat messages
 * - Live stream donations
 * - Merchandise purchases
 */
export class TransactionService {
  /**
   * Create a transaction with automatic commission calculation
   *
   * @example
   * // Subscription payment
   * await transactionService.createTransaction({
   *   userId: subscriber.id,
   *   creatorId: creator.id,
   *   transactionType: 'subscription',
   *   amount: 9.99,
   *   relatedId: subscriptionId,
   *   relatedType: 'subscription',
   * });
   */
  async createTransaction(
    input: CreateTransactionInput,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    let commission: CommissionResult | null = null;

    // Calculate commission for creator transactions
    if (input.creatorId && !options.skipCommission) {
      commission = await commissionService.calculateCommission(input.creatorId, input.amount);
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: input.userId,
        creatorId: input.creatorId,
        transactionType: input.transactionType,
        amount: input.amount,
        currency: 'USD',
        platformFee: commission?.platformFee ?? null,
        creatorEarnings: commission?.creatorEarnings ?? null,
        commissionRatePercent: commission?.ratePercent ?? null,
        subscriberCountAtTime: commission?.subscriberCountAtTime ?? null,
        status: options.status ?? 'pending',
        stripePaymentId: options.stripePaymentId,
        relatedId: input.relatedId,
        relatedType: input.relatedType,
        description: input.description,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    return {
      transactionId: transaction.id,
      amount: Number(transaction.amount),
      platformFee: transaction.platformFee ? Number(transaction.platformFee) : null,
      creatorEarnings: transaction.creatorEarnings ? Number(transaction.creatorEarnings) : null,
      commissionRatePercent: transaction.commissionRatePercent
        ? Number(transaction.commissionRatePercent)
        : null,
      subscriberCountAtTime: transaction.subscriberCountAtTime,
      status: transaction.status,
    };
  }

  /**
   * Mark transaction as completed
   */
  async completeTransaction(transactionId: string, stripePaymentId?: string): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'completed',
        ...(stripePaymentId && { stripePaymentId }),
      },
    });
  }

  /**
   * Mark transaction as failed
   */
  async failTransaction(transactionId: string): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'failed' },
    });
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(transactionId: string): Promise<void> {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'refunded' },
    });
  }

  // =========================================================================
  // SUBSCRIBER COUNT MANAGEMENT
  // =========================================================================

  /**
   * Increment subscriber count when a new subscription is created
   * Must be called atomically with subscription creation
   */
  async incrementSubscriberCount(creatorId: string): Promise<number> {
    const result = await prisma.creatorProfile.update({
      where: { id: creatorId },
      data: {
        totalSubscribers: { increment: 1 },
      },
      select: { totalSubscribers: true },
    });

    return result.totalSubscribers;
  }

  /**
   * Decrement subscriber count when subscription is cancelled/expired
   * Ensures count never goes below 0
   */
  async decrementSubscriberCount(creatorId: string): Promise<number> {
    // Use raw query for conditional decrement (prevent negative)
    await prisma.$executeRaw`
      UPDATE creator_profiles 
      SET total_subscribers = GREATEST(total_subscribers - 1, 0)
      WHERE id = ${creatorId}::uuid
    `;

    // Fetch updated count
    const profile = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { totalSubscribers: true },
    });

    return profile?.totalSubscribers ?? 0;
  }

  /**
   * Get current subscriber count for a creator
   */
  async getSubscriberCount(creatorId: string): Promise<number> {
    const profile = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { totalSubscribers: true },
    });

    return profile?.totalSubscribers ?? 0;
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string) {
    return prisma.transaction.findUnique({
      where: { id: transactionId },
    });
  }

  /**
   * Get user's transaction history
   */
  async getUserTransactions(
    userId: string,
    options: {
      type?: TransactionType;
      status?: TransactionStatus;
      limit?: number;
      cursor?: string;
    } = {}
  ) {
    const { type, status, limit = 20, cursor } = options;

    return prisma.transaction.findMany({
      where: {
        userId,
        ...(type && { transactionType: type }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }

  /**
   * Get creator's earnings with commission breakdown
   */
  async getCreatorEarnings(creatorId: string, periodStart?: Date, periodEnd?: Date) {
    const where = {
      creatorId,
      status: 'completed' as const,
      transactionType: {
        in: ['subscription', 'ppv', 'tip', 'message', 'live_tip'] as TransactionType[],
      },
      ...(periodStart && { createdAt: { gte: periodStart } }),
      ...(periodEnd && { createdAt: { lte: periodEnd } }),
    };

    const result = await prisma.transaction.aggregate({
      where,
      _sum: {
        amount: true,
        creatorEarnings: true,
        platformFee: true,
      },
      _count: true,
    });

    // Group by type
    const byType = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where,
      _sum: { creatorEarnings: true },
    });

    return {
      grossAmount: result._sum.amount?.toNumber() ?? 0,
      totalEarnings: result._sum.creatorEarnings?.toNumber() ?? 0,
      totalPlatformFees: result._sum.platformFee?.toNumber() ?? 0,
      transactionCount: result._count,
      byType: Object.fromEntries(
        byType.map((t) => [t.transactionType, t._sum.creatorEarnings?.toNumber() ?? 0])
      ),
    };
  }

  /**
   * Get earnings grouped by commission tier (for analytics)
   */
  async getEarningsByCommissionTier(creatorId: string) {
    const result = await prisma.transaction.groupBy({
      by: ['commissionRatePercent'],
      where: {
        creatorId,
        status: 'completed',
        commissionRatePercent: { not: null },
      },
      _sum: {
        amount: true,
        creatorEarnings: true,
        platformFee: true,
      },
      _count: true,
    });

    return result.map((tier) => ({
      commissionRate: tier.commissionRatePercent?.toNumber() ?? 0,
      grossAmount: tier._sum.amount?.toNumber() ?? 0,
      creatorEarnings: tier._sum.creatorEarnings?.toNumber() ?? 0,
      platformFees: tier._sum.platformFee?.toNumber() ?? 0,
      transactionCount: tier._count,
    }));
  }
}

// Singleton instance
export const transactionService = new TransactionService();
