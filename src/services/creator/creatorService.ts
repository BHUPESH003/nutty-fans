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
    private readonly creatorRepo: CreatorRepository,

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

    // Get the new onboarding status
    const onboardingStatus = (profile.onboardingStatus ||
      'not_started') as CreatorStatusResponse['onboardingStatus'];

    // Map onboarding status to route
    const routeMap: Record<string, string> = {
      not_started: '/creator/start',
      eligibility_passed: '/creator/apply/category',
      category_selected: '/creator/apply/profile',
      profile_complete: '/creator/apply/pricing',
      pricing_complete: '/creator/apply/review-pending',
      pending_review: '/creator/apply/review-pending',
      review_approved: '/creator/verify',
      review_rejected: '/creator/apply/rejected',
      kyc_pending: '/creator/verify',
      kyc_in_progress: '/creator/verify',
      kyc_approved: '/creator/payouts/setup',
      kyc_rejected: '/creator/verify',
      payout_pending: '/creator/payouts/setup',
      active: '/creator/dashboard',
      suspended: '/creator/suspended',
      banned: '/banned',
    };

    // Map onboarding status to step number
    const stepMap: Record<string, number> = {
      not_started: 1,
      eligibility_passed: 2,
      category_selected: 3,
      profile_complete: 4,
      pricing_complete: 5,
      pending_review: 5,
      review_approved: 6,
      review_rejected: 5,
      kyc_pending: 6,
      kyc_in_progress: 6,
      kyc_approved: 7,
      kyc_rejected: 6,
      payout_pending: 7,
      active: 8,
      suspended: 8,
      banned: 8,
    };

    // Derive legacy status for backward compatibility
    let legacyStatus: CreatorStatusResponse['status'];
    if (onboardingStatus === 'active') {
      legacyStatus = 'active';
    } else if (onboardingStatus === 'suspended' || onboardingStatus === 'banned') {
      legacyStatus = 'suspended';
    } else if (
      onboardingStatus.startsWith('kyc_') ||
      ['review_approved', 'kyc_pending'].includes(onboardingStatus)
    ) {
      legacyStatus = profile.kycStatus === 'submitted' ? 'kyc_in_progress' : 'pending_kyc';
    } else if (onboardingStatus === 'payout_pending') {
      legacyStatus = 'pending_payout_setup';
    } else {
      legacyStatus = 'pending_kyc';
    }

    return {
      onboardingStatus,
      status: legacyStatus,
      kycStatus: profile.kycStatus as CreatorStatusResponse['kycStatus'],
      isSquareConnected,
      isVerified: profile.isVerified,
      nextStep: routeMap[onboardingStatus] || '/creator/start',
      currentStep: stepMap[onboardingStatus] || 1,
      totalSteps: 8,
      // Include profile data for form pre-population on back navigation
      profile: {
        eligibilityCountry: profile.eligibilityCountry,
        contentTypeIntent: profile.contentTypeIntent as 'sfw' | 'nsfw' | 'both' | null,
        categoryId: profile.categoryId,
        creatorGoal: profile.creatorGoal as 'full_time' | 'side_hustle' | 'hobby' | null,
        bio: profile.bio,
        displayName: profile.user?.displayName,
        username: profile.user?.username,
        avatarUrl: profile.user?.avatarUrl,
        socialLinks: profile.socialLinks as Record<string, string> | null,
        subscriptionPrice: profile.subscriptionPrice ? Number(profile.subscriptionPrice) : null,
        freeTrialDays: profile.freeTrialDays,
      },
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
      handle: profile.user.username ?? 'user',
      displayName: profile.user.displayName ?? 'User',
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
