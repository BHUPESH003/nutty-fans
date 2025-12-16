import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import type { TransactionType, TransactionStatus, CreateTransactionInput } from '@/types/payments';
import { PLATFORM_COMMISSION_RATE, CREATOR_EARNINGS_RATE } from '@/types/payments';

export class TransactionRepository {
  /**
   * Create transaction with commission split
   */
  async create(data: CreateTransactionInput) {
    const platformFee = data.creatorId ? data.amount * PLATFORM_COMMISSION_RATE : null;
    const creatorEarnings = data.creatorId ? data.amount * CREATOR_EARNINGS_RATE : null;

    return prisma.transaction.create({
      data: {
        userId: data.userId,
        creatorId: data.creatorId,
        transactionType: data.transactionType,
        amount: data.amount,
        currency: 'USD',
        platformFee,
        creatorEarnings,
        status: 'pending',
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        description: data.description,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Find by ID
   */
  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
    });
  }

  /**
   * Update status
   */
  async updateStatus(id: string, status: TransactionStatus, paymentId?: string) {
    return prisma.transaction.update({
      where: { id },
      data: {
        status,
        ...(paymentId && { stripePaymentId: paymentId }),
      },
    });
  }

  /**
   * Get user's transactions
   */
  async findByUser(
    userId: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
    },
    cursor?: string,
    limit = 20
  ) {
    return prisma.transaction.findMany({
      where: {
        userId,
        ...(filters?.type && { transactionType: filters.type }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { createdAt: { lte: filters.endDate } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }

  /**
   * Get creator's earnings
   */
  async findByCreator(
    creatorId: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
    },
    cursor?: string,
    limit = 20
  ) {
    return prisma.transaction.findMany({
      where: {
        creatorId,
        status: 'completed',
        ...(filters?.type && { transactionType: filters.type }),
        ...(filters?.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { createdAt: { lte: filters.endDate } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }

  /**
   * Get earnings summary for creator
   */
  async getEarningsSummary(creatorId: string, periodStart?: Date, periodEnd?: Date) {
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
      _sum: { creatorEarnings: true },
      _count: true,
    });

    // Group by type
    const byType = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where,
      _sum: { creatorEarnings: true },
    });

    return {
      totalEarnings: result._sum.creatorEarnings?.toNumber() ?? 0,
      transactionCount: result._count,
      byType: Object.fromEntries(
        byType.map((t) => [t.transactionType, t._sum.creatorEarnings?.toNumber() ?? 0])
      ),
    };
  }

  /**
   * Get pending payout amount for creator
   */
  async getPendingPayoutAmount(creatorId: string, lastPayoutDate?: Date) {
    const result = await prisma.transaction.aggregate({
      where: {
        creatorId,
        status: 'completed',
        transactionType: {
          in: ['subscription', 'ppv', 'tip', 'message', 'live_tip'],
        },
        ...(lastPayoutDate && { createdAt: { gt: lastPayoutDate } }),
      },
      _sum: { creatorEarnings: true },
    });

    return result._sum.creatorEarnings?.toNumber() ?? 0;
  }

  /**
   * Find by related entity
   */
  async findByRelated(relatedType: string, relatedId: string) {
    return prisma.transaction.findFirst({
      where: { relatedType, relatedId },
    });
  }
}
