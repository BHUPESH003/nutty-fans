/**
 * Creator Types
 * Types and enums for the Creator Foundation feature
 */

// ============================================
// ENUMS
// ============================================

export type KycStatus = 'pending' | 'submitted' | 'in_review' | 'approved' | 'rejected';

export type CreatorApplicationStatus =
  | 'pending_kyc'
  | 'kyc_in_progress'
  | 'pending_payout_setup'
  | 'active'
  | 'suspended';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================
// DTOs
// ============================================

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

export interface CreatorApplicationResponse {
  creatorProfileId: string;
  status: CreatorApplicationStatus;
  nextStep: string;
}

export interface CreatorStatusResponse {
  status: CreatorApplicationStatus;
  kycStatus: KycStatus;
  isSquareConnected: boolean;
  isVerified: boolean;
  nextStep: string | null;
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
