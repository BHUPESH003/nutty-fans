/**
 * Creator Types
 * Types and enums for the Creator Foundation feature
 */

// ============================================
// ENUMS
// ============================================

export type KycStatus = 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected';

export type OnboardingStatus =
  | 'not_started'
  | 'eligibility_passed'
  | 'category_selected'
  | 'profile_complete'
  | 'pricing_complete'
  | 'pending_review'
  | 'review_approved'
  | 'review_rejected'
  | 'kyc_pending'
  | 'kyc_in_progress'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'payout_pending'
  | 'active'
  | 'suspended'
  | 'banned';

export type ContentTypeIntent = 'sfw' | 'nsfw' | 'both';

export type CreatorGoal = 'full_time' | 'side_hustle' | 'hobby';

// Legacy status type (for backward compatibility)
export type CreatorApplicationStatus =
  | 'pending_kyc'
  | 'kyc_in_progress'
  | 'pending_payout_setup'
  | 'active'
  | 'suspended';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================
// ONBOARDING STEP DTOs
// ============================================

export interface EligibilityInput {
  ageConfirmed: boolean;
  country: string;
  contentTypeIntent: ContentTypeIntent;
}

export interface CategoryInput {
  categoryId: string;
  secondaryTags?: string[];
  creatorGoal: CreatorGoal;
}

export interface ProfileSetupInput {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl?: string;
  socialLinks?: Record<string, string>;
}

export interface PricingInput {
  subscriptionPrice: number;
  subscriptionPrice3m?: number | null;
  subscriptionPrice6m?: number | null;
  subscriptionPrice12m?: number | null;
  freeTrialDays?: number;
}

// Legacy input type (for backward compatibility)
export interface CreatorApplicationInput {
  displayName: string;
  bio: string;
  categoryId: string;
  subscriptionPrice: number;
}

export interface CreatorProfileUpdate {
  displayName?: string;
  bio?: string;
  categoryId?: string;
  coverImageUrl?: string;
  socialLinks?: Record<string, string>;
  blockedCountries?: string[];
}

export interface SubscriptionPricingUpdate {
  subscriptionPrice: number;
  subscriptionPrice3m?: number | null;
  subscriptionPrice6m?: number | null;
  subscriptionPrice12m?: number | null;
  freeTrialDays?: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface OnboardingStepResponse {
  success: boolean;
  onboardingStatus: OnboardingStatus;
  nextStep: string;
}

export interface CreatorApplicationResponse {
  creatorProfileId: string;
  status: CreatorApplicationStatus;
  nextStep: string;
}

export interface CreatorStatusResponse {
  onboardingStatus: OnboardingStatus;
  status: CreatorApplicationStatus; // Legacy derived status
  kycStatus: KycStatus;
  isSquareConnected: boolean;
  isVerified: boolean;
  nextStep: string | null;
  currentStep: number;
  totalSteps: number;
}

export interface KycSessionResponse {
  sessionUrl: string;
  sessionId: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  subscriberCount: number;
  followerCount: number;
  profileViews: number;
  pendingPayout: number;
  nextPayoutDate: string | null;
  accountStatus: CreatorApplicationStatus;
}

export interface PublicCreatorProfile {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  isVerified: boolean;
  subscriberCount: number;
  postCount: number;
  subscriptionPrice: number;
  socialLinks: Record<string, string>;
  category: {
    id: string;
    name: string;
  } | null;
}

export interface PayoutRecord {
  id: string;
  amount: number;
  status: PayoutStatus;
  processedAt: string | null;
  createdAt: string;
}

// ============================================
// ONBOARDING ROUTE MAPPING
// ============================================

export const ONBOARDING_ROUTES: Record<OnboardingStatus, string> = {
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

export const ONBOARDING_STEP_NUMBER: Record<OnboardingStatus, number> = {
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

export const TOTAL_ONBOARDING_STEPS = 8;
