import { TransactionRepository } from '@/repositories/transactionRepository';
import type {
  TransactionType,
  TransactionStatus,
  PaginatedTransactions,
  TransactionRecord,
} from '@/types/payments';

export class TransactionService {
  private transactionRepo: TransactionRepository;

  constructor() {
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Get user's transaction history
   */
  async getUserTransactions(
    userId: string,
    filters?: {
      type?: TransactionType;
      status?: TransactionStatus;
      startDate?: Date;
      endDate?: Date;
    },
    cursor?: string,
    limit = 20
  ): Promise<PaginatedTransactions> {
    const transactions = await this.transactionRepo.findByUser(userId, filters, cursor, limit);
    const hasMore = transactions.length > limit;
    const items = hasMore ? transactions.slice(0, limit) : transactions;

    return {
      transactions: items.map((t) => this.formatTransaction(t)),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Get creator's earnings history
   */
  async getCreatorTransactions(
    creatorId: string,
    filters?: {
      type?: TransactionType;
      startDate?: Date;
      endDate?: Date;
    },
    cursor?: string,
    limit = 20
  ): Promise<PaginatedTransactions> {
    const transactions = await this.transactionRepo.findByCreator(
      creatorId,
      filters,
      cursor,
      limit
    );
    const hasMore = transactions.length > limit;
    const items = hasMore ? transactions.slice(0, limit) : transactions;

    return {
      transactions: items.map((t) => this.formatTransaction(t)),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Export transactions as CSV
   */
  async exportToCsv(
    userId: string,
    isCreator: boolean,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<string> {
    const limit = 1000; // Max export
    let transactions;

    if (isCreator) {
      const creatorProfile = await import('@/lib/db/prisma').then(({ prisma }) =>
        prisma.creatorProfile.findFirst({ where: { userId } })
      );
      if (!creatorProfile) throw new Error('Creator profile not found');
      transactions = await this.transactionRepo.findByCreator(
        creatorProfile.id,
        filters,
        undefined,
        limit
      );
    } else {
      transactions = await this.transactionRepo.findByUser(userId, filters, undefined, limit);
    }

    const headers = [
      'Date',
      'Type',
      'Amount',
      'Status',
      isCreator ? 'Earnings' : 'Fee',
      'Description',
    ];

    const rows = transactions.map((t) => [
      t.createdAt.toISOString(),
      t.transactionType,
      t.amount.toString(),
      t.status,
      isCreator ? (t.creatorEarnings?.toString() ?? '') : (t.platformFee?.toString() ?? ''),
      t.description ?? '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
  }

  /**
   * Get transaction by ID
   */
  async getById(transactionId: string, userId: string): Promise<TransactionRecord | null> {
    const transaction = await this.transactionRepo.findById(transactionId);
    if (!transaction) return null;

    // Verify access
    if (transaction.userId !== userId) {
      // Check if user is the creator
      const creatorProfile = await import('@/lib/db/prisma').then(({ prisma }) =>
        prisma.creatorProfile.findFirst({ where: { userId } })
      );
      if (!creatorProfile || transaction.creatorId !== creatorProfile.id) {
        return null;
      }
    }

    return this.formatTransaction(transaction);
  }

  /**
   * Format transaction for API response
   */
  private formatTransaction(
    t: NonNullable<Awaited<ReturnType<TransactionRepository['findById']>>>
  ): TransactionRecord {
    return {
      id: t.id,
      userId: t.userId,
      creatorId: t.creatorId,
      transactionType: t.transactionType,
      amount: t.amount.toNumber(),
      currency: t.currency,
      platformFee: t.platformFee?.toNumber() ?? null,
      creatorEarnings: t.creatorEarnings?.toNumber() ?? null,
      status: t.status,
      relatedId: t.relatedId,
      relatedType: t.relatedType,
      description: t.description,
      createdAt: t.createdAt,
    };
  }
}
