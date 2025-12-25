import { CreatorRepository } from '@/repositories/creatorRepository';
import type { VeriffWebhookPayload } from '@/services/integrations/veriff/types';
import { veriffClient } from '@/services/integrations/veriff/veriffClient';
import type { KycSessionResponse } from '@/types/creator';

export class KycService {
  constructor(private readonly creatorRepo: CreatorRepository) {}

  /**
   * Start KYC verification session
   */
  async startVerification(userId: string, displayName: string): Promise<KycSessionResponse> {
    // Check if user has a creator profile
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Creator profile not found. Please apply to become a creator first.');
    }

    // Check if KYC already completed
    if (profile.kycStatus === 'approved') {
      throw new Error('KYC verification already completed');
    }

    // Verify the onboarding status is at the right step
    const validStates = ['review_approved', 'kyc_pending', 'kyc_rejected'];
    const currentStatus = profile.onboardingStatus as string;
    if (!validStates.includes(currentStatus)) {
      throw new Error('Please complete all previous steps before starting KYC verification');
    }

    // Create Veriff session
    const session = await veriffClient.createSession(userId, displayName);

    // Update KYC status to submitted and store session ID
    await this.creatorRepo.update(profile.id, {
      kycStatus: 'submitted',
      kycSubmittedAt: new Date(),
      onboardingStatus: 'kyc_in_progress',
      kycSessionId: session.sessionId,
    });

    return {
      sessionUrl: session.sessionUrl,
      sessionId: session.sessionId,
    };
  }

  /**
   * Sync KYC status from Veriff API (for when webhook is missed)
   * Returns the updated status
   */
  async syncStatusFromVeriff(userId: string): Promise<{
    status: string;
    updated: boolean;
    message: string;
  }> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Creator profile not found');
    }

    // If already approved, no need to check
    if (profile.kycStatus === 'approved') {
      return {
        status: 'approved',
        updated: false,
        message: 'KYC already approved',
      };
    }

    // Get the session ID
    const sessionId = profile.kycSessionId;
    if (!sessionId) {
      return {
        status: profile.kycStatus as string,
        updated: false,
        message: 'No KYC session found. Please start verification first.',
      };
    }

    // Fetch decision from Veriff
    const decision = await veriffClient.getSessionDecision(sessionId);
    if (!decision) {
      return {
        status: profile.kycStatus as string,
        updated: false,
        message: 'Unable to fetch status from verification provider',
      };
    }

    // Map the decision to KYC status
    const kycStatus = veriffClient.mapDecisionToKycStatus(decision.action);

    // Check if status changed
    const currentStatus = profile.kycStatus as string;
    const newStatus =
      kycStatus === 'failed' || kycStatus === 'needs_review' ? 'rejected' : kycStatus;

    if (currentStatus === newStatus || newStatus === 'pending') {
      return {
        status: currentStatus,
        updated: false,
        message:
          decision.action === 'submitted'
            ? 'Verification is still in progress'
            : `Current status: ${currentStatus}`,
      };
    }

    // Update the database with new status
    const rejectionReason = decision.reason || undefined;
    await this.creatorRepo.updateKycStatus(
      userId,
      newStatus as 'pending' | 'submitted' | 'approved' | 'rejected',
      rejectionReason
    );

    return {
      status: newStatus,
      updated: true,
      message:
        newStatus === 'approved'
          ? 'Identity verified successfully!'
          : `Verification status updated: ${newStatus}`,
    };
  }

  /**
   * Process Veriff webhook
   */
  async processWebhook(payload: VeriffWebhookPayload): Promise<void> {
    const userId = payload.vendorData;
    if (!userId) {
      console.error('Veriff webhook missing vendorData (userId)');
      return;
    }

    const kycStatus = veriffClient.mapDecisionToKycStatus(payload.action);
    const rejectionReason =
      payload.action === 'declined'
        ? (payload.verification?.reason ?? 'Verification declined')
        : undefined;

    // Map to Prisma enum values
    const prismaStatus =
      kycStatus === 'failed' || kycStatus === 'needs_review' ? 'rejected' : kycStatus;

    await this.creatorRepo.updateKycStatus(userId, prismaStatus, rejectionReason);

    // If approved, also update user role to creator
    if (prismaStatus === 'approved') {
      console.warn('KYC approved for user:', userId);
    }
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string): boolean {
    return veriffClient.verifyWebhookSignature(payload, signature);
  }
}
