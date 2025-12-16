import crypto from 'crypto';

import type { VeriffSessionRequest, VeriffSessionResponse, VeriffWebhookPayload } from './types';

const VERIFF_BASE_URL = process.env['VERIFF_BASE_URL'] ?? 'https://stationapi.veriff.com';
const VERIFF_API_KEY = process.env['VERIFF_API_KEY'] ?? '';
const VERIFF_API_SECRET = process.env['VERIFF_API_SECRET'] ?? '';

export class VeriffClient {
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.baseUrl = VERIFF_BASE_URL;
    this.apiKey = VERIFF_API_KEY;
    this.apiSecret = VERIFF_API_SECRET;
  }

  /**
   * Create a new Veriff verification session
   */
  async createSession(
    userId: string,
    displayName: string
  ): Promise<{ sessionUrl: string; sessionId: string }> {
    const callbackUrl = `${process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'}/api/webhooks/veriff`;

    const payload: VeriffSessionRequest = {
      verification: {
        callback: callbackUrl,
        person: {
          firstName: displayName,
          idNumber: userId,
        },
        vendorData: userId,
      },
    };

    const response = await fetch(`${this.baseUrl}/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-CLIENT': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Veriff API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as VeriffSessionResponse;

    return {
      sessionUrl: data.verification.url,
      sessionId: data.verification.id,
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.apiSecret) {
      console.warn('Veriff API secret not configured, skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature.toLowerCase()),
        Buffer.from(expectedSignature.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(body: string): VeriffWebhookPayload {
    return JSON.parse(body) as VeriffWebhookPayload;
  }

  /**
   * Map Veriff decision to KYC status
   */
  mapDecisionToKycStatus(action: string): 'approved' | 'failed' | 'needs_review' | 'pending' {
    switch (action) {
      case 'approved':
        return 'approved';
      case 'declined':
      case 'expired':
      case 'abandoned':
        return 'failed';
      case 'resubmission_requested':
        return 'needs_review';
      default:
        return 'pending';
    }
  }
}

// Singleton instance
export const veriffClient = new VeriffClient();
