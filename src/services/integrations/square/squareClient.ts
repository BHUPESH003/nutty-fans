import crypto from 'crypto';

import type { CheckoutParams, CheckoutResult } from '@/types/payments';

import {
  buildSquareAuthorizeUrl,
  generateSecureState,
  getSquareOAuthConfig,
  type SquareOAuthResult,
} from './oauthBuilder';
import type { SquareOAuthTokenResponse, SquareMerchant } from './types';

const SQUARE_BASE_URL =
  process.env['SQUARE_ENVIRONMENT'] === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

const SQUARE_APPLICATION_ID = process.env['SQUARE_APPLICATION_ID'] ?? '';
const SQUARE_APPLICATION_SECRET = process.env['SQUARE_APPLICATION_SECRET'] ?? '';
const SQUARE_WEBHOOK_SIGNATURE_KEY = process.env['SQUARE_WEBHOOK_SIGNATURE_KEY'] ?? '';

export class SquareClient {
  private baseUrl: string;
  private applicationId: string;
  private applicationSecret: string;
  private webhookSignatureKey: string;

  constructor() {
    this.baseUrl = SQUARE_BASE_URL;
    this.applicationId = SQUARE_APPLICATION_ID;
    this.applicationSecret = SQUARE_APPLICATION_SECRET;
    this.webhookSignatureKey = SQUARE_WEBHOOK_SIGNATURE_KEY;
  }

  /**
   * Generate a cryptographically secure state token
   */
  generateState(): string {
    return generateSecureState();
  }

  /**
   * Generate OAuth authorization URL with all required parameters
   * Uses the new OAuth builder for proper URL construction
   */
  getAuthorizationUrl(state?: string): SquareOAuthResult {
    const config = getSquareOAuthConfig();
    const oauthState = state ?? generateSecureState();

    return buildSquareAuthorizeUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      state: oauthState,
      environment: config.environment,
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<SquareOAuthTokenResponse> {
    const config = getSquareOAuthConfig();

    const response = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        client_id: this.applicationId,
        client_secret: this.applicationSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri, // Required by Square
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square OAuth error: ${response.status} - ${errorText}`);
    }

    return (await response.json()) as SquareOAuthTokenResponse;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<SquareOAuthTokenResponse> {
    const response = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        client_id: this.applicationId,
        client_secret: this.applicationSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square token refresh error: ${response.status} - ${errorText}`);
    }

    return (await response.json()) as SquareOAuthTokenResponse;
  }

  /**
   * Get merchant info
   */
  async getMerchant(accessToken: string, merchantId: string): Promise<SquareMerchant> {
    const response = await fetch(`${this.baseUrl}/v2/merchants/${merchantId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square merchant error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.merchant as SquareMerchant;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, url: string): boolean {
    if (!this.webhookSignatureKey) {
      console.warn('Square webhook signature key not configured');
      return true;
    }

    const stringToSign = url + payload;
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSignatureKey)
      .update(stringToSign)
      .digest('base64');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  /**
   * Create Checkout (Payment Link)
   */
  async createCheckout(accessToken: string, params: CheckoutParams): Promise<CheckoutResult> {
    const response = await fetch(`${this.baseUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        order: {
          location_id: await this.getLocationId(accessToken),
          line_items: params.lineItems.map((item) => ({
            name: item.name,
            quantity: item.quantity.toString(),
            base_price_money: {
              amount: Math.round(item.basePriceMoney.amount * 100), // Convert to cents
              currency: item.basePriceMoney.currency,
            },
          })),
          metadata: params.metadata,
        },
        checkout_options: {
          redirect_url: params.redirectUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Square checkout error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      checkoutId: data.payment_link.id,
      checkoutUrl: data.payment_link.url,
    };
  }

  /**
   * Get primary location ID (needed for orders)
   */
  private async getLocationId(accessToken: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v2/locations`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Square locations');
    }

    const data = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const location = data.locations?.find((l: any) => l.status === 'ACTIVE');
    return location?.id;
  }

  /**
   * Check if environment is configured
   */
  isConfigured(): boolean {
    return Boolean(this.applicationId && this.applicationSecret);
  }
}

// Singleton instance
export const squareClient = new SquareClient();
