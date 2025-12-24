import { CreatorRepository } from '@/repositories/creatorRepository';
import { PayoutRepository } from '@/repositories/payoutRepository';
import { squareClient } from '@/services/integrations/square/squareClient';
import { squareTokenService } from '@/services/integrations/square/squareTokenService';

export class PaymentService {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly creatorRepo: CreatorRepository,
    // eslint-disable-next-line no-unused-vars
    private readonly payoutRepo: PayoutRepository
  ) {}

  /**
   * Generate Square OAuth URL with all required parameters
   * Returns the URL and state for CSRF validation
   */
  async getConnectUrl(userId: string): Promise<{
    url: string;
    state: string;
    redirectUri: string;
    environment: string;
  }> {
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Creator profile not found');
    }

    if (profile.kycStatus !== 'approved') {
      throw new Error('KYC verification must be completed before setting up payouts');
    }

    // Generate OAuth URL using the new builder
    const oauthResult = squareClient.getAuthorizationUrl();

    // Log for debugging
    console.warn('[Square OAuth] Generated authorization URL:', {
      userId,
      environment: oauthResult.environment,
      redirectUri: oauthResult.redirectUri,
      scopes: oauthResult.scopes,
      statePrefix: oauthResult.state.substring(0, 10) + '...',
    });

    // TODO: In production, persist state to session/cookie/DB for validation
    // await this.storeOAuthState(userId, oauthResult.state);

    return {
      url: oauthResult.url,
      state: oauthResult.state,
      redirectUri: oauthResult.redirectUri,
      environment: oauthResult.environment,
    };
  }

  /**
   * Complete Square connection for a user
   * Exchanges code for tokens and stores them securely (encrypted)
   */
  async completeConnection(userId: string, code: string): Promise<void> {
    // Exchange authorization code for tokens
    const tokenResponse = await squareClient.exchangeCodeForToken(code);

    // Get creator profile
    const profile = await this.creatorRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Creator profile not found');
    }

    // Calculate token expiry (Square tokens expire in 30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Store tokens securely (encrypted)
    await squareTokenService.storeTokens(profile.id, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      merchantId: tokenResponse.merchant_id,
      expiresAt,
    });

    console.warn('[Square OAuth] Connection completed for user:', userId);
  }

  /**
   * Get Square connection status
   */
  async getConnectionStatus(userId: string) {
    return squareTokenService.getConnectionStatus(userId);
  }

  /**
   * Disconnect Square account
   */
  async disconnect(userId: string): Promise<void> {
    await squareTokenService.disconnect(userId);
  }

  /**
   * Get access token for making Square API calls
   * Automatically refreshes if needed
   */
  async getAccessToken(userId: string): Promise<string | null> {
    const tokens = await squareTokenService.getTokens(userId);
    return tokens?.accessToken || null;
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
    const status = await squareTokenService.getConnectionStatus(userId);
    return status.isConnected;
  }
}
