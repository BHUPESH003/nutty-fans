import { BundleItemRepository } from '@/repositories/bundleItemRepository';
import { BundlePurchaseRepository } from '@/repositories/bundlePurchaseRepository';
import { BundleRepository } from '@/repositories/bundleRepository';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { PostRepository } from '@/repositories/postRepository';
import { PaymentService } from '@/services/payments/paymentService';

export class BundleService {
  constructor(
    private readonly bundleRepo = new BundleRepository(),
    private readonly bundleItemRepo = new BundleItemRepository(),
    private readonly bundlePurchaseRepo = new BundlePurchaseRepository(),
    private readonly postRepo = new PostRepository(),
    private readonly creatorRepo = new CreatorRepository(),
    private readonly paymentService = new PaymentService()
  ) {}

  async createBundle(
    creatorId: string,
    input: {
      title: string;
      description?: string;
      price: number;
      originalPrice?: number | null;
      coverImageUrl?: string | null;
      postIds?: string[];
    }
  ) {
    const bundle = await this.bundleRepo.create({
      creatorId,
      title: input.title,
      description: input.description ?? null,
      price: input.price,
      originalPrice: input.originalPrice ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
    });

    if (input.postIds?.length) {
      await this.updateBundleItems(bundle.id, creatorId, input.postIds);
    }

    return bundle;
  }

  async updateBundle(
    bundleId: string,
    creatorId: string,
    input: {
      title?: string;
      description?: string | null;
      price?: number;
      originalPrice?: number | null;
      coverImageUrl?: string | null;
      status?: 'draft' | 'active' | 'archived';
    }
  ) {
    const existing = await this.bundleRepo.findById(bundleId);
    if (!existing) throw new Error('Bundle not found');
    if (existing.creatorId !== creatorId) throw new Error('Unauthorized');

    return this.bundleRepo.update(bundleId, input);
  }

  async getBundleForCreator(bundleId: string, creatorId: string) {
    const bundle = await this.bundleRepo.findById(bundleId);
    if (!bundle) throw new Error('Bundle not found');
    if (bundle.creatorId !== creatorId) throw new Error('Unauthorized');
    return bundle;
  }

  async updateBundleItems(bundleId: string, creatorId: string, postIds: string[]) {
    await this.getBundleForCreator(bundleId, creatorId);

    // Validate posts belong to creator
    for (const postId of postIds) {
      const post = await this.postRepo.findById(postId);
      if (!post) throw new Error('Post not found');
      if (post.creatorId !== creatorId) throw new Error('Post does not belong to this creator');
    }

    const count = await this.bundleItemRepo.replaceItems(bundleId, postIds);
    await this.bundleRepo.setItemCount(bundleId, count);
    return { itemCount: count };
  }

  async activateBundle(bundleId: string, creatorId: string) {
    const existing = await this.getBundleForCreator(bundleId, creatorId);
    if (existing.status !== 'draft') throw new Error('Bundle must be in draft to activate');
    if (existing.itemCount <= 0) throw new Error('Add at least one post to the bundle');

    return this.bundleRepo.update(bundleId, { status: 'active' });
  }

  async listCreatorBundles(creatorId: string, cursor?: string, limit = 20) {
    const bundles = await this.bundleRepo.listByCreator(creatorId, cursor, limit);
    const hasMore = bundles.length > limit;
    const items = hasMore ? bundles.slice(0, limit) : bundles;
    return {
      bundles: items,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  async listPublicBundlesByCreatorId(
    creatorId: string,
    viewerId?: string,
    cursor?: string,
    limit = 20
  ) {
    const bundles = await this.bundleRepo.listActiveByCreator(creatorId, cursor, limit);
    const hasMore = bundles.length > limit;
    const items = hasMore ? bundles.slice(0, limit) : bundles;

    if (!viewerId) {
      return {
        bundles: items.map((b) => ({ ...b, isPurchased: false })),
        nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
        hasMore,
      };
    }

    const purchased = await Promise.all(
      items.map((b) => this.bundlePurchaseRepo.hasPurchasedBundle(viewerId, b.id))
    );

    return {
      bundles: items.map((b, idx) => ({ ...b, isPurchased: purchased[idx] })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  async listPublicBundlesByHandle(handle: string, viewerId?: string, cursor?: string, limit = 20) {
    const creator = await this.creatorRepo.findByHandle(handle);
    if (!creator) return null;
    return this.listPublicBundlesByCreatorId(creator.id, viewerId, cursor, limit);
  }

  async purchaseBundle(userId: string, bundleId: string) {
    const bundle = await this.bundleRepo.findById(bundleId);
    if (!bundle) throw new Error('Bundle not found');
    if (bundle.status !== 'active') throw new Error('Bundle is not available');

    const alreadyPurchased = await this.bundlePurchaseRepo.hasPurchasedBundle(userId, bundleId);
    if (alreadyPurchased) throw new Error('You already own this bundle');

    const price = bundle.price.toNumber();
    const creatorId = bundle.creatorId;

    // NOTE: TransactionType enum currently has no "bundle".
    // We record as "ppv" and set relatedType = "bundle" to preserve auditability without schema changes.
    const debit = await this.paymentService.debitWallet(userId, {
      transactionType: 'ppv',
      amount: price,
      creatorId,
      relatedId: bundleId,
      relatedType: 'bundle',
      description: `Bundle purchase: ${bundle.title}`,
    });

    const purchase = await this.bundlePurchaseRepo.create({
      bundleId,
      userId,
      transactionId: debit.transactionId,
      pricePaid: price,
    });

    await this.bundleRepo.incrementPurchaseCount(bundleId);

    return {
      purchase: {
        id: purchase.id,
        bundleId: purchase.bundleId,
        pricePaid: purchase.pricePaid.toNumber(),
        createdAt: purchase.createdAt,
      },
      transactionId: debit.transactionId,
    };
  }

  async listUserBundlePurchases(userId: string, cursor?: string, limit = 20) {
    const purchases = await this.bundlePurchaseRepo.listByUser(userId, cursor, limit);
    const hasMore = purchases.length > limit;
    const items = hasMore ? purchases.slice(0, limit) : purchases;

    return {
      purchases: items.map((p) => ({
        id: p.id,
        bundleId: p.bundleId,
        pricePaid: p.pricePaid.toNumber(),
        createdAt: p.createdAt,
        bundle: p.bundle,
      })),
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }
}
