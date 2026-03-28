import { CreatorRepository } from '@/repositories/creatorRepository';
import { UserRepository } from '@/repositories/userRepository';
import type {
  OnboardingStatus,
  OnboardingStepResponse,
  EligibilityInput,
  CategoryInput,
  ProfileSetupInput,
  PricingInput,
} from '@/types/creator';

// Blocked countries list (can be moved to config)
const BLOCKED_COUNTRIES = ['KP', 'IR', 'SY', 'CU', 'RU'];

// Banned username patterns
const BANNED_USERNAME_PATTERNS = [
  /admin/i,
  /nuttyfans/i,
  /^nf$/i,
  /support/i,
  /moderator/i,
  /official/i,
];

// Banned bio keywords
const BANNED_BIO_KEYWORDS = ['underage', 'minor', 'child'];

export class OnboardingService {
  constructor(
    private readonly creatorRepo: CreatorRepository,

    private readonly userRepo: UserRepository
  ) {}

  /**
   * Get the redirect route for a given onboarding status
   */
  getRouteForStatus(status: OnboardingStatus): string {
    const routes: Record<OnboardingStatus, string> = {
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
    return routes[status];
  }

  /**
   * Step 1: Submit eligibility form
   */
  async submitEligibility(
    userId: string,
    input: EligibilityInput
  ): Promise<OnboardingStepResponse> {
    // Validate age confirmation
    if (!input.ageConfirmed) {
      throw new Error('You must confirm you are 18 or older');
    }

    // Validate country
    if (BLOCKED_COUNTRIES.includes(input.country.toUpperCase())) {
      throw new Error('Creator accounts are not available in your country');
    }

    // Check if user already has a profile
    const existingProfile = await this.creatorRepo.findByUserId(userId);

    if (existingProfile) {
      // Update existing profile
      await this.creatorRepo.update(existingProfile.id, {
        eligibilityCountry: input.country.toUpperCase(),
        contentTypeIntent: input.contentTypeIntent,
        onboardingStatus: 'eligibility_passed',
      });
    } else {
      // Create new profile - don't assign to variable since we only need the side effect
      await this.creatorRepo.create({
        userId,
        eligibilityCountry: input.country.toUpperCase(),
        contentTypeIntent: input.contentTypeIntent,
        onboardingStatus: 'eligibility_passed',
      });
    }

    return {
      success: true,
      onboardingStatus: 'eligibility_passed',
      nextStep: this.getRouteForStatus('eligibility_passed'),
    };
  }

  /**
   * Step 2: Submit category selection
   */
  async submitCategory(userId: string, input: CategoryInput): Promise<OnboardingStepResponse> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Please complete eligibility first');
    }

    if (profile.onboardingStatus !== 'eligibility_passed') {
      throw new Error('Please complete previous steps first');
    }

    await this.creatorRepo.update(profile.id, {
      category: { connect: { id: input.categoryId } },
      secondaryTags: input.secondaryTags || [],
      creatorGoal: input.creatorGoal,
      onboardingStatus: 'category_selected',
    });

    return {
      success: true,
      onboardingStatus: 'category_selected',
      nextStep: this.getRouteForStatus('category_selected'),
    };
  }

  /**
   * Step 3: Submit profile setup
   */
  async submitProfile(userId: string, input: ProfileSetupInput): Promise<OnboardingStepResponse> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Please complete eligibility first');
    }

    if (profile.onboardingStatus !== 'category_selected') {
      throw new Error('Please complete previous steps first');
    }

    // Validate username uniqueness
    const existingUser = await this.userRepo.findByUsername(input.username);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Username is already taken');
    }

    // Validate username pattern
    for (const pattern of BANNED_USERNAME_PATTERNS) {
      if (pattern.test(input.username)) {
        throw new Error('This username is not allowed');
      }
    }

    // Validate bio
    if (input.bio.length < 20) {
      throw new Error('Bio must be at least 20 characters');
    }

    // Update user's display name and username
    await this.userRepo.update(userId, {
      displayName: input.displayName,
      username: input.username,
      avatarUrl: input.avatarUrl,
    });

    // Update creator profile
    await this.creatorRepo.update(profile.id, {
      bio: input.bio,
      socialLinks: input.socialLinks || {},
      onboardingStatus: 'profile_complete',
    });

    return {
      success: true,
      onboardingStatus: 'profile_complete',
      nextStep: this.getRouteForStatus('profile_complete'),
    };
  }

  /**
   * Step 4: Submit pricing setup
   */
  async submitPricing(userId: string, input: PricingInput): Promise<OnboardingStepResponse> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Please complete eligibility first');
    }

    if (profile.onboardingStatus !== 'profile_complete') {
      throw new Error('Please complete previous steps first');
    }

    // Validate price range
    if (input.subscriptionPrice < 4.99 || input.subscriptionPrice > 49.99) {
      throw new Error('Subscription price must be between $4.99 and $49.99');
    }

    // Validate free trial
    if (input.freeTrialDays && (input.freeTrialDays < 0 || input.freeTrialDays > 7)) {
      throw new Error('Free trial must be between 0 and 7 days');
    }

    await this.creatorRepo.update(profile.id, {
      subscriptionPrice: input.subscriptionPrice,
      subscriptionPrice3m: input.subscriptionPrice3m,
      subscriptionPrice6m: input.subscriptionPrice6m,
      subscriptionPrice12m: input.subscriptionPrice12m,
      freeTrialDays: input.freeTrialDays || 0,
      onboardingStatus: 'pricing_complete',
    });

    return {
      success: true,
      onboardingStatus: 'pricing_complete',
      nextStep: this.getRouteForStatus('pricing_complete'),
    };
  }

  /**
   * Step 5: Submit for review
   */
  async submitForReview(userId: string): Promise<OnboardingStepResponse> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Please complete eligibility first');
    }

    if (profile.onboardingStatus !== 'pricing_complete') {
      throw new Error('Please complete previous steps first');
    }

    // Run automated review checks
    const flaggedReasons: string[] = [];
    const user = await this.userRepo.findById(userId);

    // Check bio for banned keywords
    if (profile.bio) {
      for (const keyword of BANNED_BIO_KEYWORDS) {
        if (profile.bio.toLowerCase().includes(keyword)) {
          flaggedReasons.push(`Bio contains prohibited content: ${keyword}`);
        }
      }
    }

    // Check username
    if (user?.username) {
      for (const pattern of BANNED_USERNAME_PATTERNS) {
        if (pattern.test(user.username)) {
          flaggedReasons.push('Username matches banned pattern');
        }
      }
    }

    // For MVP: Auto-approve if no flags
    const isAutoApproved = flaggedReasons.length === 0;
    const newStatus: OnboardingStatus = isAutoApproved ? 'review_approved' : 'pending_review';

    await this.creatorRepo.update(profile.id, {
      onboardingStatus: newStatus,
      reviewStatus: isAutoApproved ? 'auto_approved' : 'pending',
      reviewFlaggedReasons: flaggedReasons,
      reviewCompletedAt: isAutoApproved ? new Date() : undefined,
    });

    // If auto-approved, set KYC pending
    if (isAutoApproved) {
      await this.creatorRepo.update(profile.id, {
        onboardingStatus: 'kyc_pending',
      });
      return {
        success: true,
        onboardingStatus: 'kyc_pending',
        nextStep: this.getRouteForStatus('kyc_pending'),
      };
    }

    return {
      success: true,
      onboardingStatus: newStatus,
      nextStep: this.getRouteForStatus(newStatus),
    };
  }

  /**
   * Get current onboarding status
   */
  async getOnboardingStatus(userId: string): Promise<{
    onboardingStatus: OnboardingStatus;
    nextStep: string;
    currentStep: number;
    totalSteps: number;
    profile: {
      eligibilityCountry?: string | null;
      contentTypeIntent?: string | null;
      categoryId?: string | null;
      creatorGoal?: string | null;
      bio?: string | null;
      subscriptionPrice?: number;
      kycStatus?: string;
      isSquareConnected?: boolean;
    } | null;
  }> {
    const profile = await this.creatorRepo.findByUserId(userId);

    if (!profile) {
      return {
        onboardingStatus: 'not_started',
        nextStep: this.getRouteForStatus('not_started'),
        currentStep: 1,
        totalSteps: 8,
        profile: null,
      };
    }

    const status = profile.onboardingStatus as OnboardingStatus;
    const stepNumbers: Record<OnboardingStatus, number> = {
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

    return {
      onboardingStatus: status,
      nextStep: this.getRouteForStatus(status),
      currentStep: stepNumbers[status],
      totalSteps: 8,
      profile: {
        eligibilityCountry: profile.eligibilityCountry,
        contentTypeIntent: profile.contentTypeIntent,
        categoryId: profile.categoryId,
        creatorGoal: profile.creatorGoal,
        bio: profile.bio,
        subscriptionPrice: Number(profile.subscriptionPrice),
        kycStatus: profile.kycStatus,
        isSquareConnected: Boolean(profile.stripeAccountId && profile.stripeOnboardingComplete),
      },
    };
  }
}
