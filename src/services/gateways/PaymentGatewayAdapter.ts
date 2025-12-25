/**
 * Payment Gateway Adapter Interface
 *
 * All payment gateways (Square, Stripe, etc.) must implement this interface.
 * This ensures the business logic is completely decoupled from gateway specifics.
 *
 * IMPORTANT: This adapter handles ONLY wallet funding operations.
 * Features should NEVER call the gateway directly.
 */

export interface TopUpRequest {
  /** User ID for tracking */
  userId: string;
  /** Amount in USD (dollars, not cents) */
  amount: number;
  /** Redirect URL after successful payment */
  successUrl: string;
  /** Redirect URL if payment cancelled */
  cancelUrl: string;
  /** Optional idempotency key to prevent duplicate charges */
  idempotencyKey?: string;
  /** Optional metadata for tracking */
  metadata?: Record<string, string>;
}

export interface TopUpCheckoutResult {
  /** Gateway's checkout session ID */
  checkoutId: string;
  /** URL to redirect user for payment */
  checkoutUrl: string;
  /** Expiration time of this checkout session */
  expiresAt?: Date;
}

export interface ChargeResult {
  /** Gateway's payment/charge ID */
  paymentId: string;
  /** Payment status */
  status: 'succeeded' | 'pending' | 'failed';
  /** Amount charged (in dollars) */
  amount: number;
  /** Currency */
  currency: string;
  /** Error message if failed */
  errorMessage?: string;
}

export interface WebhookEvent {
  /** Event type */
  type: 'payment.completed' | 'payment.failed' | 'payment.refunded';
  /** Gateway's event ID */
  eventId: string;
  /** Gateway's payment/checkout ID */
  paymentId: string;
  /** Amount involved */
  amount: number;
  /** Currency */
  currency: string;
  /** Our reference ID (userId or transactionId) */
  referenceId?: string;
  /** Raw payload for logging */
  rawPayload: unknown;
}

/**
 * Payment Gateway Adapter
 *
 * Gateway implementations must:
 * - NOT contain any business logic
 * - NOT know about subscriptions, tips, or any features
 * - NOT apply commission
 * - ONLY handle card payment mechanics
 */

export interface PaymentGatewayAdapter {
  /** Gateway name for logging/audit */
  readonly name: string;

  /**
   * Create a checkout session for wallet top-up
   * User is redirected to the gateway's hosted payment page
   */
  createTopUpCheckout(request: TopUpRequest): Promise<TopUpCheckoutResult>;

  /**
   * Charge a saved payment method (for auto top-up)
   * No redirect needed - direct charge
   */
  chargePaymentMethod(
    paymentMethodId: string,
    amount: number,
    idempotencyKey: string
  ): Promise<ChargeResult>;

  /**
   * Verify webhook signature and parse event
   * Returns null if signature is invalid
   */
  parseWebhookEvent(payload: string, signature: string, url: string): WebhookEvent | null;

  /**
   * Check if gateway is properly configured
   */
  isConfigured(): boolean;
}
