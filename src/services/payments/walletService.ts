import { prisma } from '@/lib/db/prisma';
import { TransactionRepository } from '@/repositories/transactionRepository';
import { WalletRepository } from '@/repositories/walletRepository';
import { transactionService } from '@/services/finance/transactionService';
import type { WalletBalance, TransactionRecord } from '@/types/payments';
import { MINIMUM_WALLET_TOPUP } from '@/types/payments';

export class WalletService {
  private walletRepo: WalletRepository;
  private transactionRepo: TransactionRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    const balance = await this.walletRepo.getBalance(userId);
    return {
      userId,
      balance,
      currency: 'USD',
    };
  }

  /**
   * Top up wallet
   */
  async topup(userId: string, amount: number): Promise<{ transactionId: string; balance: number }> {
    if (amount < MINIMUM_WALLET_TOPUP) {
      throw new Error(`Minimum top-up amount is $${MINIMUM_WALLET_TOPUP}`);
    }

    // Record the topup transaction
    const transaction = await this.walletRepo.recordTopup(userId, amount);

    const balance = await this.walletRepo.getBalance(userId);

    return {
      transactionId: transaction.id,
      balance,
    };
  }

  /**
   * Debit wallet for a purchase
   */
  async debit(
    userId: string,
    amount: number,
    creatorId: string,
    transactionType: 'subscription' | 'ppv' | 'tip',
    relatedId?: string,
    description?: string
  ): Promise<TransactionRecord> {
    // Check balance
    const hasBalance = await this.walletRepo.hasSufficientBalance(userId, amount);
    if (!hasBalance) {
      throw new Error('Insufficient wallet balance');
    }

    // Create transaction using unified service (auto-calculates commission)
    const result = await transactionService.createTransaction(
      {
        userId,
        creatorId,
        transactionType,
        amount,
        relatedId,
        relatedType: transactionType,
        description,
        metadata: { paidWithWallet: true },
      },
      { status: 'completed' } // Wallet transactions are instant
    );

    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: amount } },
    });

    return {
      id: result.transactionId,
      userId,
      creatorId,
      transactionType,
      amount,
      currency: 'USD',
      platformFee: result.platformFee,
      creatorEarnings: result.creatorEarnings,
      status: result.status,
      relatedId: relatedId ?? null,
      relatedType: transactionType,
      description: description ?? null,
      createdAt: new Date(),
    };
  }

  /**
   * Get wallet transaction history
   */
  async getTransactions(userId: string, cursor?: string, limit = 20) {
    const transactions = await this.walletRepo.getTransactions(userId, cursor, limit);
    const hasMore = transactions.length > limit;
    const items = hasMore ? transactions.slice(0, limit) : transactions;

    return {
      transactions: items.map((t) => ({
        id: t.id,
        transactionType: t.transactionType,
        amount: t.amount.toNumber(),
        status: t.status,
        description: t.description,
        createdAt: t.createdAt,
        isCredit: t.transactionType === 'wallet_topup',
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    return this.walletRepo.hasSufficientBalance(userId, amount);
  }
}
