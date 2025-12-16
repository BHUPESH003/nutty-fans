import { TransactionRepository } from '@/repositories/transactionRepository';
import type { SendTipInput, TransactionRecord } from '@/types/payments';

import { WalletService } from './walletService';

export class TipService {
  private walletService: WalletService;
  private transactionRepo: TransactionRepository;

  constructor() {
    this.walletService = new WalletService();
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Send a tip to a creator
   */
  async sendTip(userId: string, input: SendTipInput): Promise<TransactionRecord> {
    if (input.amount <= 0) {
      throw new Error('Tip amount must be positive');
    }

    if (input.paymentSource === 'wallet') {
      // Pay with wallet
      return this.walletService.debit(
        userId,
        input.amount,
        input.creatorId,
        'tip',
        input.relatedId,
        input.message || 'Tip'
      );
    } else {
      // Create pending transaction for card payment
      const transaction = await this.transactionRepo.create({
        userId,
        creatorId: input.creatorId,
        transactionType: 'tip',
        amount: input.amount,
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        description: input.message || 'Tip',
        metadata: { message: input.message },
      });

      return {
        id: transaction.id,
        userId: transaction.userId,
        creatorId: transaction.creatorId,
        transactionType: transaction.transactionType,
        amount: transaction.amount.toNumber(),
        currency: transaction.currency,
        platformFee: transaction.platformFee?.toNumber() ?? null,
        creatorEarnings: transaction.creatorEarnings?.toNumber() ?? null,
        status: transaction.status,
        relatedId: transaction.relatedId,
        relatedType: transaction.relatedType,
        description: transaction.description,
        createdAt: transaction.createdAt,
      };
    }
  }

  /**
   * Get tips received by creator
   */
  async getReceivedTips(creatorId: string, cursor?: string, limit = 20) {
    const tips = await this.transactionRepo.findByCreator(
      creatorId,
      { type: 'tip', status: 'completed' },
      cursor,
      limit
    );

    const hasMore = tips.length > limit;
    const items = hasMore ? tips.slice(0, limit) : tips;

    return {
      tips: items.map((t) => ({
        id: t.id,
        amount: t.amount.toNumber(),
        creatorEarnings: t.creatorEarnings?.toNumber() ?? 0,
        message: t.description,
        createdAt: t.createdAt,
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }
}
