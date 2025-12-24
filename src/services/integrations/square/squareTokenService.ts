/**
 * Square Token Service
 *
 * Manages Square OAuth tokens including:
 * - Storing tokens securely (encrypted)
 * - Retrieving and decrypting tokens
 * - Refreshing expired tokens
 * - Checking token validity
 */

import { encryptToken, decryptToken } from '@/lib/crypto/tokenEncryption';
import { prisma } from '@/lib/db/prisma';

import { squareClient } from './squareClient';

// Token expires 30 days after issuance, refresh when 5 days remain
const TOKEN_REFRESH_THRESHOLD_DAYS = 5;

export interface SquareTokens {
  accessToken: string;
  refreshToken: string;
  merchantId: string;
  expiresAt: Date;
}

export interface StoredSquareConnection {
  merchantId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  connectedAt: Date | null;
  isConnected: boolean;
  needsRefresh: boolean;
}

export class SquareTokenService {
  /**
   * Store Square OAuth tokens for a creator
   * Tokens are encrypted before storage
   */
  async storeTokens(creatorProfileId: string, tokens: SquareTokens): Promise<void> {
    const encryptedAccessToken = encryptToken(tokens.accessToken);
    const encryptedRefreshToken = encryptToken(tokens.refreshToken);

    await prisma.creatorProfile.update({
      where: { id: creatorProfileId },
      data: {
        squareMerchantId: tokens.merchantId,
        squareAccessToken: encryptedAccessToken,
        squareRefreshToken: encryptedRefreshToken,
        squareTokenExpiresAt: tokens.expiresAt,
        squareConnectedAt: new Date(),
        stripeOnboardingComplete: true, // Mark payout setup as complete
        onboardingStatus: 'active', // Creator is now fully onboarded
      },
    });

    console.warn('[Square Token Service] Tokens stored for creator:', creatorProfileId);
  }

  /**
   * Get Square tokens for a creator, decrypted
   * Automatically refreshes if tokens are close to expiry
   */
  async getTokens(userId: string): Promise<SquareTokens | null> {
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        squareMerchantId: true,
        squareAccessToken: true,
        squareRefreshToken: true,
        squareTokenExpiresAt: true,
      },
    });

    if (!profile?.squareAccessToken || !profile?.squareRefreshToken) {
      return null;
    }

    try {
      const accessToken = decryptToken(profile.squareAccessToken);
      const refreshToken = decryptToken(profile.squareRefreshToken);
      const expiresAt = profile.squareTokenExpiresAt || new Date();
      const merchantId = profile.squareMerchantId || '';

      // Check if token needs refresh
      const now = new Date();
      const daysUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry <= TOKEN_REFRESH_THRESHOLD_DAYS) {
        console.warn('[Square Token Service] Token expiring soon, refreshing...');
        return await this.refreshTokens(profile.id, refreshToken, merchantId);
      }

      return { accessToken, refreshToken, merchantId, expiresAt };
    } catch (error) {
      console.error('[Square Token Service] Failed to get tokens:', error);
      return null;
    }
  }

  /**
   * Refresh Square tokens and store the new ones
   */
  async refreshTokens(
    creatorProfileId: string,
    currentRefreshToken: string,
    merchantId: string
  ): Promise<SquareTokens | null> {
    try {
      const tokenResponse = await squareClient.refreshToken(currentRefreshToken);

      // Calculate new expiry (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const newTokens: SquareTokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || currentRefreshToken,
        merchantId: tokenResponse.merchant_id || merchantId,
        expiresAt,
      };

      // Store the new tokens
      await this.storeTokens(creatorProfileId, newTokens);

      console.warn('[Square Token Service] Tokens refreshed for creator:', creatorProfileId);
      return newTokens;
    } catch (error) {
      console.error('[Square Token Service] Failed to refresh tokens:', error);
      return null;
    }
  }

  /**
   * Get connection status for a creator
   */
  async getConnectionStatus(userId: string): Promise<StoredSquareConnection> {
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId },
      select: {
        squareMerchantId: true,
        squareAccessToken: true,
        squareRefreshToken: true,
        squareTokenExpiresAt: true,
        squareConnectedAt: true,
      },
    });

    if (!profile) {
      return {
        merchantId: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        connectedAt: null,
        isConnected: false,
        needsRefresh: false,
      };
    }

    const isConnected = Boolean(profile.squareAccessToken && profile.squareMerchantId);
    const now = new Date();
    const expiresAt = profile.squareTokenExpiresAt;
    const daysUntilExpiry = expiresAt
      ? (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    return {
      merchantId: profile.squareMerchantId,
      accessToken: profile.squareAccessToken ? '[encrypted]' : null,
      refreshToken: profile.squareRefreshToken ? '[encrypted]' : null,
      expiresAt: profile.squareTokenExpiresAt,
      connectedAt: profile.squareConnectedAt,
      isConnected,
      needsRefresh: isConnected && daysUntilExpiry <= TOKEN_REFRESH_THRESHOLD_DAYS,
    };
  }

  /**
   * Disconnect Square from a creator account
   */
  async disconnect(userId: string): Promise<void> {
    await prisma.creatorProfile.update({
      where: { userId },
      data: {
        squareMerchantId: null,
        squareAccessToken: null,
        squareRefreshToken: null,
        squareTokenExpiresAt: null,
        squareConnectedAt: null,
        stripeOnboardingComplete: false,
      },
    });

    console.warn('[Square Token Service] Disconnected Square for user:', userId);
  }
}

// Singleton instance
export const squareTokenService = new SquareTokenService();
