import { prisma } from '@/lib/db/prisma';

/**
 * WalletRepository
 * Balance is stored on `User.walletBalance` (canonical). Transactions are the audit trail.
 */
export class WalletRepository {
  /**
   * Get user's wallet balance from the user row (same source as PPV unlock checks).
   */
  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    if (!user) return 0;
    return user.walletBalance.toNumber();
  }

  /**
   * Record wallet topup
   */
  async recordTopup(userId: string, amount: number, paymentId?: string) {
    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
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
      }),
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: amount } },
      }),
    ]);
    return tx;
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
