/**
 * Tip Service
 *
 * Handles tips from fans to creators.
 * All payments go through PaymentService.debitWallet()
 *
 * CLOSED-LOOP WALLET: No card payments - wallet only
 */

import { TransactionRepository } from '@/repositories/transactionRepository';
import type { TransactionRecord } from '@/types/payments';

import { paymentService } from './paymentService';

export interface SendTipInput {
  creatorId: string;
  amount: number;
  message?: string;
  relatedType?: 'post' | 'message';
  relatedId?: string;
}

export class TipService {
  private transactionRepo: TransactionRepository;

  constructor() {
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Send a tip to a creator
   * Debits wallet - no card option
   */
  async sendTip(userId: string, input: SendTipInput): Promise<TransactionRecord> {
    if (input.amount <= 0) {
      throw new Error('Tip amount must be positive');
    }

    if (input.amount < 1) {
      throw new Error('Minimum tip amount is $1');
    }

    if (input.amount > 200) {
      throw new Error('Maximum tip amount is $200');
    }

    // Debit wallet (single payment path)
    const result = await paymentService.debitWallet(userId, {
      transactionType: 'tip',
      amount: input.amount,
      creatorId: input.creatorId,
      relatedId: input.relatedId,
      relatedType: input.relatedType,
      description: input.message || 'Tip',
      metadata: { message: input.message },
    });

    return {
      id: result.transactionId,
      userId,
      creatorId: input.creatorId,
      transactionType: 'tip',
      amount: result.amount,
      currency: 'USD',
      platformFee: result.platformFee,
      creatorEarnings: result.creatorEarnings,
      status: 'completed',
      relatedId: input.relatedId ?? null,
      relatedType: input.relatedType ?? null,
      description: input.message ?? null,
      createdAt: new Date(),
    };
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
