import crypto from 'crypto';

import { CreatorRepository } from '@/repositories/creatorRepository';
import { PayoutRepository } from '@/repositories/payoutRepository';
import { squareClient } from '@/services/integrations/square/squareClient';

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';

export class PaymentService {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly creatorRepo: CreatorRepository,
    // eslint-disable-next-line no-unused-vars
    private readonly payoutRepo: PayoutRepository
  ) {}

  /**
   * Generate Square OAuth URL
   */
  async getConnectUrl(userId: string): Promise<{ url: string; state: string }> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Creator profile not found');
    }

    if (profile.kycStatus !== 'approved') {
      throw new Error('KYC verification must be completed before setting up payouts');
    }

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    // In production, store state in session/cache with userId

    const redirectUri = `${APP_URL}/api/creator/square/callback`;
    const url = squareClient.getAuthorizationUrl(state, redirectUri);

    return { url, state };
  }

  /**
   * Handle Square OAuth callback
   */
  // eslint-disable-next-line no-unused-vars
  async handleCallback(code: string, _state: string): Promise<{ success: boolean }> {
    // In production, verify state matches stored session state
    // For now, we'll proceed with the code exchange

    await squareClient.exchangeCodeForToken(code);

    // The merchant ID will be extracted from the token response
    // In a real implementation, you'd look up the user from the state token
    // For now, this returns the result and the controller handles the user lookup

    return {
      success: true,
    };
  }

  /**
   * Complete Square connection for a user
   */
  async completeConnection(userId: string, code: string): Promise<void> {
    const tokenResponse = await squareClient.exchangeCodeForToken(code);

    // Store the merchant ID (tokens should be encrypted and stored securely)
    await this.creatorRepo.updateSquareConnection(userId, tokenResponse.merchant_id, true);

    // Update onboardingStatus to active (creator is now fully onboarded)
    const profile = await this.creatorRepo.findByUserId(userId);
    if (profile) {
      await this.creatorRepo.update(profile.id, {
        onboardingStatus: 'active',
      });
    }
  }

  /**
   * Get payout history
   */
  async getPayouts(userId: string, limit = 20, offset = 0) {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Creator profile not found');
    }

    const payouts = await this.payoutRepo.findByCreatorId(profile.id, limit, offset);
    const pendingAmount = await this.payoutRepo.getPendingAmount(profile.id);
    const nextPayoutDate = this.payoutRepo.getNextPayoutDate();

    return {
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        processedAt: p.processedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      pendingAmount,
      nextPayoutDate: nextPayoutDate.toISOString(),
    };
  }

  /**
   * Check if Square is connected
   */
  async isConnected(userId: string): Promise<boolean> {
    const profile = await this.creatorRepo.findByUserId(userId);
    return Boolean(profile?.stripeAccountId && profile?.stripeOnboardingComplete);
  }
}
