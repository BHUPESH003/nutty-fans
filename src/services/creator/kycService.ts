import { CreatorRepository } from '@/repositories/creatorRepository';
import type { VeriffWebhookPayload } from '@/services/integrations/veriff/types';
import { veriffClient } from '@/services/integrations/veriff/veriffClient';
import type { KycSessionResponse } from '@/types/creator';

export class KycService {
  // eslint-disable-next-line no-unused-vars
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

    // Create Veriff session
    const session = await veriffClient.createSession(userId, displayName);

    // Update KYC status to submitted
    await this.creatorRepo.updateKycStatus(userId, 'submitted');

    return {
      sessionUrl: session.sessionUrl,
      sessionId: session.sessionId,
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
