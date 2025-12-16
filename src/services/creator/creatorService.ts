import { CreatorRepository } from '@/repositories/creatorRepository';
import { UserRepository } from '@/repositories/userRepository';
import type {
  CreatorApplicationInput,
  CreatorApplicationResponse,
  CreatorStatusResponse,
} from '@/types/creator';

const MIN_SUBSCRIPTION_PRICE = 4.99;
const MAX_SUBSCRIPTION_PRICE = 49.99;

export class CreatorService {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly creatorRepo: CreatorRepository,
    // eslint-disable-next-line no-unused-vars
    private readonly userRepo: UserRepository
  ) {}

  /**
   * Submit creator application
   */
  async apply(userId: string, input: CreatorApplicationInput): Promise<CreatorApplicationResponse> {
    // Check if user already has a creator profile
    const existing = await this.creatorRepo.findByUserId(userId);
    if (existing) {
      throw new Error('You have already applied to become a creator');
    }

    // Validate subscription price
    if (
      input.subscriptionPrice < MIN_SUBSCRIPTION_PRICE ||
      input.subscriptionPrice > MAX_SUBSCRIPTION_PRICE
    ) {
      throw new Error(
        `Subscription price must be between $${MIN_SUBSCRIPTION_PRICE} and $${MAX_SUBSCRIPTION_PRICE}`
      );
    }

    // Create creator profile with pending status
    const creatorProfile = await this.creatorRepo.create({
      userId,
      bio: input.bio,
      categoryId: input.categoryId,
      subscriptionPrice: input.subscriptionPrice,
    });

    return {
      creatorProfileId: creatorProfile.id,
      status: 'pending_kyc',
      nextStep: '/creator/verify',
    };
  }

  /**
   * Get creator application status
   */
  async getStatus(userId: string): Promise<CreatorStatusResponse | null> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      return null;
    }

    const isSquareConnected = Boolean(profile.stripeAccountId && profile.stripeOnboardingComplete);
    const kycApproved = profile.kycStatus === 'approved';

    let status: CreatorStatusResponse['status'];
    let nextStep: string | null = null;

    if (!kycApproved) {
      if (profile.kycStatus === 'pending') {
        status = 'pending_kyc';
        nextStep = '/creator/verify';
      } else if (profile.kycStatus === 'submitted') {
        status = 'kyc_in_progress';
        nextStep = null; // Wait for webhook
      } else {
        status = 'pending_kyc';
        nextStep = '/creator/verify';
      }
    } else if (!isSquareConnected) {
      status = 'pending_payout_setup';
      nextStep = '/creator/payouts/setup';
    } else {
      status = 'active';
      nextStep = '/creator/dashboard';
    }

    return {
      status,
      kycStatus: profile.kycStatus as CreatorStatusResponse['kycStatus'],
      isSquareConnected,
      isVerified: profile.isVerified,
      nextStep,
    };
  }

  /**
   * Update creator profile
   */
  async updateProfile(
    userId: string,
    update: {
      displayName?: string;
      bio?: string;
      categoryId?: string;
      coverImageUrl?: string;
      socialLinks?: Record<string, string>;
      blockedCountries?: string[];
    }
  ) {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Creator profile not found');
    }

    // Note: displayName update should be done separately if needed
    // For now, we only update creator profile fields

    return this.creatorRepo.update(profile.id, {
      bio: update.bio,
      category: update.categoryId ? { connect: { id: update.categoryId } } : undefined,
      coverImageUrl: update.coverImageUrl,
      socialLinks: update.socialLinks ?? undefined,
      blockedCountries: update.blockedCountries,
    });
  }

  /**
   * Update subscription pricing
   */
  async updatePricing(
    userId: string,
    pricing: {
      subscriptionPrice: number;
      subscriptionPrice3m?: number | null;
      subscriptionPrice6m?: number | null;
      subscriptionPrice12m?: number | null;
      freeTrialDays?: number;
    }
  ) {
    // Validate base price
    if (
      pricing.subscriptionPrice < MIN_SUBSCRIPTION_PRICE ||
      pricing.subscriptionPrice > MAX_SUBSCRIPTION_PRICE
    ) {
      throw new Error(
        `Subscription price must be between $${MIN_SUBSCRIPTION_PRICE} and $${MAX_SUBSCRIPTION_PRICE}`
      );
    }

    // Validate free trial
    if (
      pricing.freeTrialDays !== undefined &&
      (pricing.freeTrialDays < 0 || pricing.freeTrialDays > 30)
    ) {
      throw new Error('Free trial must be between 0 and 30 days');
    }

    return this.creatorRepo.updatePricing(userId, pricing);
  }

  /**
   * Get public creator profile
   */
  async getPublicProfile(handle: string) {
    const profile = await this.creatorRepo.findByHandle(handle);
    if (!profile) {
      return null;
    }

    // Increment view count
    await this.creatorRepo.incrementProfileViews(profile.id);

    const subscriberCount = await this.creatorRepo.getSubscriberCount(profile.id);

    return {
      id: profile.id,
      handle: profile.user.username,
      displayName: profile.user.displayName,
      bio: profile.bio,
      avatarUrl: profile.user.avatarUrl,
      coverImageUrl: profile.coverImageUrl,
      isVerified: profile.isVerified,
      subscriberCount,
      postCount: profile.totalPosts,
      subscriptionPrice: Number(profile.subscriptionPrice),
      socialLinks: profile.socialLinks as Record<string, string>,
      category: profile.category ? { id: profile.category.id, name: profile.category.name } : null,
    };
  }
}
