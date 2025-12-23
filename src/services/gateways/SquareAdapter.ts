/**
 * Square Payment Gateway Adapter
 *
 * Implements PaymentGatewayAdapter for Square.
 * This is the ONLY place Square-specific code should exist.
 *
 * IMPORTANT: This adapter handles ONLY payment mechanics.
 * It has NO knowledge of subscriptions, tips, commission, or any business logic.
 */

import crypto from 'crypto';

import type {
  PaymentGatewayAdapter,
  TopUpRequest,
  TopUpCheckoutResult,
  ChargeResult,
  WebhookEvent,
} from './PaymentGatewayAdapter';

const SQUARE_BASE_URL =
  process.env['SQUARE_ENVIRONMENT'] === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

const SQUARE_ACCESS_TOKEN = process.env['SQUARE_ACCESS_TOKEN'] ?? '';
const SQUARE_WEBHOOK_SIGNATURE_KEY = process.env['SQUARE_WEBHOOK_SIGNATURE_KEY'] ?? '';
const SQUARE_LOCATION_ID = process.env['SQUARE_LOCATION_ID'] ?? '';

export class SquareAdapter implements PaymentGatewayAdapter {
  readonly name = 'square';

  private baseUrl: string;
  private accessToken: string;
  private webhookSignatureKey: string;
  private locationId: string;

  constructor() {
    this.baseUrl = SQUARE_BASE_URL;
    this.accessToken = SQUARE_ACCESS_TOKEN;
    this.webhookSignatureKey = SQUARE_WEBHOOK_SIGNATURE_KEY;
    this.locationId = SQUARE_LOCATION_ID;
  }

  isConfigured(): boolean {
    return Boolean(this.accessToken && this.locationId);
  }

  async createTopUpCheckout(request: TopUpRequest): Promise<TopUpCheckoutResult> {
    if (!this.isConfigured()) {
      throw new Error('Square payment gateway is not configured');
    }

    const idempotencyKey = request.idempotencyKey ?? crypto.randomUUID();

    const response = await fetch(`${this.baseUrl}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        order: {
          location_id: this.locationId,
          line_items: [
            {
              name: 'Wallet Top-Up',
              quantity: '1',
              base_price_money: {
                amount: Math.round(request.amount * 100), // Convert to cents
                currency: 'USD',
              },
            },
          ],
          metadata: {
            user_id: request.userId,
            type: 'wallet_topup',
            ...request.metadata,
          },
        },
        checkout_options: {
          redirect_url: request.successUrl,
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

  async chargePaymentMethod(
    paymentMethodId: string,
    amount: number,
    idempotencyKey: string
  ): Promise<ChargeResult> {
    if (!this.isConfigured()) {
      throw new Error('Square payment gateway is not configured');
    }

    const response = await fetch(`${this.baseUrl}/v2/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        source_id: paymentMethodId,
        amount_money: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'USD',
        },
        autocomplete: true,
        location_id: this.locationId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        paymentId: '',
        status: 'failed',
        amount,
        currency: 'USD',
        errorMessage: data.errors?.[0]?.detail ?? 'Payment failed',
      };
    }

    const payment = data.payment;
    return {
      paymentId: payment.id,
      status: payment.status === 'COMPLETED' ? 'succeeded' : 'pending',
      amount: payment.amount_money.amount / 100,
      currency: payment.amount_money.currency,
    };
  }

  parseWebhookEvent(payload: string, signature: string, url: string): WebhookEvent | null {
    // Verify signature
    if (this.webhookSignatureKey) {
      const stringToSign = url + payload;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSignatureKey)
        .update(stringToSign)
        .digest('base64');

      try {
        const isValid = crypto.timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expectedSignature)
        );
        if (!isValid) return null;
      } catch {
        return null;
      }
    }

    const event = JSON.parse(payload);
    const eventType = event.type;
    const payment = event.data?.object?.payment;

    if (!payment) return null;

    let type: WebhookEvent['type'];
    switch (eventType) {
      case 'payment.completed':
        type = 'payment.completed';
        break;
      case 'payment.failed':
        type = 'payment.failed';
        break;
      case 'refund.created':
        type = 'payment.refunded';
        break;
      default:
        return null; // Unknown event type
    }

    return {
      type,
      eventId: event.event_id ?? crypto.randomUUID(),
      paymentId: payment.id,
      amount: (payment.amount_money?.amount ?? 0) / 100,
      currency: payment.amount_money?.currency ?? 'USD',
      referenceId: payment.reference_id ?? event.data?.object?.order?.metadata?.user_id,
      rawPayload: event,
    };
  }
}

// Singleton instance
export const squareAdapter = new SquareAdapter();
