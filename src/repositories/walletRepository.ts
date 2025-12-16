import { prisma } from '@/lib/db/prisma';

/**
 * WalletRepository
 * Note: Users don't have a separate wallet table - we calculate balance from transactions
 */
export class WalletRepository {
  /**
   * Get user's wallet balance
   * Balance = SUM(wallet_topup) - SUM(wallet debits)
   */
  async getBalance(userId: string): Promise<number> {
    // Sum of topups
    const topups = await prisma.transaction.aggregate({
      where: {
        userId,
        transactionType: 'wallet_topup',
        status: 'completed',
      },
      _sum: { amount: true },
    });

    // Sum of wallet debits (negative amounts in metadata or separate query)
    // For simplicity, we'll track "wallet_debit" in transaction description
    const debits = await prisma.transaction.aggregate({
      where: {
        userId,
        status: 'completed',
        metadata: {
          path: ['paidWithWallet'],
          equals: true,
        },
      },
      _sum: { amount: true },
    });

    const topupTotal = topups._sum.amount?.toNumber() ?? 0;
    const debitTotal = debits._sum.amount?.toNumber() ?? 0;

    return topupTotal - debitTotal;
  }

  /**
   * Record wallet topup
   */
  async recordTopup(userId: string, amount: number, paymentId?: string) {
    return prisma.transaction.create({
      data: {
        userId,
        transactionType: 'wallet_topup',
        amount,
        currency: 'USD',
        status: 'completed',
        stripePaymentId: paymentId,
        description: 'Wallet top-up',
        metadata: { type: 'topup' },
      },
    });
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Get wallet transaction history
   */
  async getTransactions(userId: string, cursor?: string, limit = 20) {
    return prisma.transaction.findMany({
      where: {
        userId,
        OR: [
          { transactionType: 'wallet_topup' },
          {
            metadata: {
              path: ['paidWithWallet'],
              equals: true,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }
}
