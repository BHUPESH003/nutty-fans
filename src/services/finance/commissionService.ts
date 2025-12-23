import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export interface CommissionTier {
  id: string;
  minSubs: number;
  maxSubs: number | null;
  ratePercent: Prisma.Decimal;
}

export interface CommissionResult {
  ratePercent: number;
  platformFee: number;
  creatorEarnings: number;
  subscriberCountAtTime: number;
}

// Default tiers (used as fallback if database is empty)
const DEFAULT_TIERS = [
  { minSubs: 0, maxSubs: 100, ratePercent: 4 },
  { minSubs: 101, maxSubs: 200, ratePercent: 6 },
  { minSubs: 201, maxSubs: 400, ratePercent: 8 },
  { minSubs: 401, maxSubs: 600, ratePercent: 10 },
  { minSubs: 601, maxSubs: 800, ratePercent: 12 },
  { minSubs: 801, maxSubs: 1000, ratePercent: 14 },
  { minSubs: 1001, maxSubs: null, ratePercent: 16 },
];

/**
 * Commission Service - Single source of truth for platform commission calculations
 *
 * Key features:
 * - Tier resolution based on subscriber count
 * - All transaction types use the same logic
 * - Commission snapshotted per transaction (immutable)
 */
export class CommissionService {
  private tiers: CommissionTier[] = [];
  private tiersLoaded = false;

  /**
   * Load commission tiers from database (cached in memory)
   */
  private async loadTiers(): Promise<void> {
    if (this.tiersLoaded) return;

    try {
      const dbTiers = await prisma.commissionTier.findMany({
        where: { deprecatedAt: null },
        orderBy: { minSubs: 'asc' },
      });

      if (dbTiers.length > 0) {
        this.tiers = dbTiers;
      } else {
        // Seed default tiers if none exist
        await this.seedDefaultTiers();
        this.tiers = await prisma.commissionTier.findMany({
          where: { deprecatedAt: null },
          orderBy: { minSubs: 'asc' },
        });
      }

      this.tiersLoaded = true;
    } catch (error) {
      console.error('Failed to load commission tiers:', error);
      // Use defaults as fallback
      this.tiers = DEFAULT_TIERS.map((t, i) => ({
        id: `default-${i}`,
        minSubs: t.minSubs,
        maxSubs: t.maxSubs,
        ratePercent: { toNumber: () => t.ratePercent } as Prisma.Decimal,
      }));
      this.tiersLoaded = true;
    }
  }

  /**
   * Seed default commission tiers into database
   */
  private async seedDefaultTiers(): Promise<void> {
    console.warn('Seeding default commission tiers...');

    for (const tier of DEFAULT_TIERS) {
      await prisma.commissionTier.create({
        data: {
          minSubs: tier.minSubs,
          maxSubs: tier.maxSubs,
          ratePercent: tier.ratePercent,
          description: tier.maxSubs
            ? `${tier.minSubs}-${tier.maxSubs} subscribers`
            : `${tier.minSubs}+ subscribers`,
        },
      });
    }

    console.warn('Commission tiers seeded successfully');
  }

  /**
   * Force reload tiers from database (use when admin updates tiers)
   */
  async reloadTiers(): Promise<void> {
    this.tiersLoaded = false;
    await this.loadTiers();
  }

  /**
   * Resolve commission tier for a given subscriber count
   */
  private resolveTier(subscriberCount: number): CommissionTier {
    for (const tier of this.tiers) {
      const maxSubs = tier.maxSubs;
      if (subscriberCount >= tier.minSubs && (maxSubs === null || subscriberCount <= maxSubs)) {
        return tier;
      }
    }

    // Fallback to highest tier if no match (shouldn't happen with proper data)
    const lastTier = this.tiers[this.tiers.length - 1];
    if (lastTier) return lastTier;

    // Ultimate fallback
    return {
      id: 'fallback',
      minSubs: 0,
      maxSubs: null,
      ratePercent: { toNumber: () => 16 } as Prisma.Decimal,
    };
  }

  /**
   * Round to 2 decimal places (standard half-up rounding)
   */
  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calculate commission for a creator transaction
   *
   * @param creatorId - The creator receiving the payment
   * @param transactionAmount - The gross transaction amount
   * @returns Commission breakdown (rate, platform fee, creator earnings, subscriber count)
   */
  async calculateCommission(
    creatorId: string,
    transactionAmount: number
  ): Promise<CommissionResult> {
    await this.loadTiers();

    // Get creator's current subscriber count
    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { totalSubscribers: true },
    });

    const subscriberCount = creator?.totalSubscribers ?? 0;
    const tier = this.resolveTier(subscriberCount);
    const ratePercent = Number(tier.ratePercent);

    const platformFee = this.round2(transactionAmount * (ratePercent / 100));
    const creatorEarnings = this.round2(transactionAmount - platformFee);

    return {
      ratePercent,
      platformFee,
      creatorEarnings,
      subscriberCountAtTime: subscriberCount,
    };
  }

  /**
   * Calculate commission by user ID (finds creator profile first)
   */
  async calculateCommissionByUserId(
    userId: string,
    transactionAmount: number
  ): Promise<CommissionResult> {
    const creator = await prisma.creatorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!creator) {
      throw new Error('Creator profile not found');
    }

    return this.calculateCommission(creator.id, transactionAmount);
  }

  /**
   * Get current commission rate for a creator (for display purposes)
   */
  async getCurrentRate(creatorId: string): Promise<number> {
    await this.loadTiers();

    const creator = await prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      select: { totalSubscribers: true },
    });

    const subscriberCount = creator?.totalSubscribers ?? 0;
    const tier = this.resolveTier(subscriberCount);

    return Number(tier.ratePercent);
  }

  /**
   * Get all active commission tiers (for admin/display)
   */
  async getAllTiers(): Promise<
    Array<{
      minSubs: number;
      maxSubs: number | null;
      ratePercent: number;
    }>
  > {
    await this.loadTiers();

    return this.tiers.map((t) => ({
      minSubs: t.minSubs,
      maxSubs: t.maxSubs,
      ratePercent: Number(t.ratePercent),
    }));
  }

  /**
   * Get the tier for a specific subscriber count (for preview/simulation)
   */
  async getRateForSubscriberCount(subscriberCount: number): Promise<number> {
    await this.loadTiers();
    const tier = this.resolveTier(subscriberCount);
    return Number(tier.ratePercent);
  }
}

// Singleton instance
export const commissionService = new CommissionService();
