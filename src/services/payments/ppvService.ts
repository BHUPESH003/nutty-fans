import { prisma } from '@/lib/db/prisma';
import { PpvRepository } from '@/repositories/ppvRepository';
import { TransactionRepository } from '@/repositories/transactionRepository';
import type { PpvPurchaseRecord, PurchasePpvInput } from '@/types/payments';

import { WalletService } from './walletService';

export class PpvService {
  private ppvRepo: PpvRepository;
  private walletService: WalletService;
  private transactionRepo: TransactionRepository;

  constructor() {
    this.ppvRepo = new PpvRepository();
    this.walletService = new WalletService();
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Purchase PPV content
   */
  async purchase(
    userId: string,
    postId: string,
    input: PurchasePpvInput
  ): Promise<{ purchase: PpvPurchaseRecord; transactionId: string }> {
    // Check if already purchased
    const alreadyPurchased = await this.ppvRepo.hasPurchased(userId, postId);
    if (alreadyPurchased) {
      throw new Error('You already own this content');
    }

    // Get post and verify it's PPV
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        accessLevel: true,
        ppvPrice: true,
        creatorId: true,
        content: true,
      },
    });

    if (!post) throw new Error('Post not found');
    if (post.accessLevel !== 'ppv') throw new Error('This content is not PPV');
    if (!post.ppvPrice) throw new Error('PPV price not set');

    const price = post.ppvPrice.toNumber();

    let transaction;

    if (input.paymentSource === 'wallet') {
      // Pay with wallet
      transaction = await this.walletService.debit(
        userId,
        price,
        post.creatorId,
        'ppv',
        postId,
        `PPV unlock: ${post.content?.substring(0, 50) || 'Content'}`
      );
    } else {
      // Create pending transaction for card payment
      transaction = await this.transactionRepo.create({
        userId,
        creatorId: post.creatorId,
        transactionType: 'ppv',
        amount: price,
        relatedType: 'ppv',
        relatedId: postId,
        description: `PPV unlock: ${post.content?.substring(0, 50) || 'Content'}`,
      });
    }

    // Create PPV purchase record
    const purchase = await this.ppvRepo.create({
      userId,
      postId,
      transactionId: transaction.id,
      pricePaid: price,
    });

    return {
      purchase: {
        id: purchase.id,
        userId: purchase.userId,
        postId: purchase.postId!,
        pricePaid: purchase.pricePaid.toNumber(),
        createdAt: purchase.createdAt,
      },
      transactionId: transaction.id,
    };
  }

  /**
   * Check if user has purchased content
   */
  async hasPurchased(userId: string, postId: string): Promise<boolean> {
    return this.ppvRepo.hasPurchased(userId, postId);
  }

  /**
   * Get user's PPV purchases
   */
  async getUserPurchases(userId: string, cursor?: string, limit = 20) {
    const purchases = await this.ppvRepo.findByUser(userId, cursor, limit);
    const hasMore = purchases.length > limit;
    const items = hasMore ? purchases.slice(0, limit) : purchases;

    return {
      purchases: items.map((p) => ({
        id: p.id,
        postId: p.postId,
        pricePaid: p.pricePaid.toNumber(),
        createdAt: p.createdAt,
        post: p.post
          ? {
              id: p.post.id,
              content: p.post.content,
              thumbnailUrl: p.post.media[0]?.thumbnailUrl ?? null,
            }
          : null,
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }
}
