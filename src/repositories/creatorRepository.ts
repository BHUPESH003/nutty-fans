import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export class CreatorRepository {
  /**
   * Find creator profile by user ID
   */
  async findByUserId(userId: string) {
    return prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find creator profile by username (handle)
   */
  async findByHandle(handle: string) {
    return prisma.creatorProfile.findFirst({
      where: {
        user: {
          username: handle,
        },
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Create a new creator profile
   */
  async create(data: {
    userId: string;
    bio?: string;
    categoryId?: string;
    subscriptionPrice: number;
  }) {
    return prisma.creatorProfile.create({
      data: {
        userId: data.userId,
        bio: data.bio ?? null,
        categoryId: data.categoryId ?? null,
        subscriptionPrice: data.subscriptionPrice,
        kycStatus: 'pending',
      },
    });
  }

  /**
   * Update creator profile
   */
  async update(id: string, data: Prisma.CreatorProfileUpdateInput) {
    return prisma.creatorProfile.update({
      where: { id },
      data,
    });
  }

  /**
   * Update KYC status
   */
  async updateKycStatus(
    userId: string,
    status: 'pending' | 'submitted' | 'approved' | 'rejected',
    rejectionReason?: string
  ) {
    const updateData: Prisma.CreatorProfileUpdateInput = {
      kycStatus: status,
    };

    if (status === 'submitted') {
      updateData.kycSubmittedAt = new Date();
    } else if (status === 'approved') {
      updateData.kycVerifiedAt = new Date();
      updateData.isVerified = true;
    } else if (status === 'rejected' && rejectionReason) {
      updateData.kycRejectionReason = rejectionReason;
    }

    return prisma.creatorProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  /**
   * Update Square connection
   */
  async updateSquareConnection(
    userId: string,
    squareAccountId: string,
    onboardingComplete: boolean
  ) {
    // Note: The schema uses stripeAccountId, we'll use it for Square
    // In production, rename this field or add a new one
    return prisma.creatorProfile.update({
      where: { userId },
      data: {
        stripeAccountId: squareAccountId,
        stripeOnboardingComplete: onboardingComplete,
      },
    });
  }

  /**
   * Update subscription pricing
   */
  async updatePricing(
    userId: string,
    pricing: {
      subscriptionPrice?: number;
      subscriptionPrice3m?: number | null;
      subscriptionPrice6m?: number | null;
      subscriptionPrice12m?: number | null;
      freeTrialDays?: number;
    }
  ) {
    return prisma.creatorProfile.update({
      where: { userId },
      data: pricing,
    });
  }

  /**
   * Get subscriber count for creator
   */
  async getSubscriberCount(creatorId: string): Promise<number> {
    return prisma.subscription.count({
      where: {
        creatorId,
        status: 'active',
      },
    });
  }

  /**
   * Get follower count for creator
   */
  async getFollowerCount(creatorId: string): Promise<number> {
    return prisma.follow.count({
      where: {
        creatorId,
      },
    });
  }

  /**
   * Increment profile view count (stored in analytics)
   */
  async incrementProfileViews(creatorId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.creatorAnalytics.upsert({
      where: {
        creatorId_date: {
          creatorId,
          date: today,
        },
      },
      create: {
        creatorId,
        date: today,
        profileViews: 1,
      },
      update: {
        profileViews: {
          increment: 1,
        },
      },
    });
  }
}
