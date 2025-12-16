import { TransactionRepository } from '@/repositories/transactionRepository';
import { SquareClient } from '@/services/integrations/square/squareClient';
// import { CreatorRepository } from '@/repositories/creatorRepository';
// import { PayoutRepository } from '@/repositories/payoutRepository';
import type { CheckoutParams, CheckoutResult, SquarePaymentWebhookEvent } from '@/types/payments';

const squareClient = new SquareClient();
// const creatorRepo = new CreatorRepository();
// const payoutRepo = new PayoutRepository();

export class PaymentService {
  private squareClient: SquareClient;
  private transactionRepo: TransactionRepository;

  constructor() {
    this.squareClient = squareClient;
    this.transactionRepo = new TransactionRepository();
  }

  /**
   * Create checkout session
   */
  async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    // For platform payments (subscriptions, wallet topup), use platform credentials
    // For direct creator payments, we might use their token if we were doing direct payments
    // But for this architecture, we take payment on platform and payout later
    // So we use the platform's Square account (which needs to be configured)

    // NOTE: In a real marketplace, we might use Multiparty Payments
    // For this MVP, we'll assume platform takes payment and handles payouts
    const accessToken = process.env['SQUARE_ACCESS_TOKEN'];
    if (!accessToken) throw new Error('Square access token not configured');

    return this.squareClient.createCheckout(accessToken, params);
  }

  /**
   * Process Square webhook
   */
  async processWebhook(
    event: SquarePaymentWebhookEvent,
    signature: string,
    url: string
  ): Promise<void> {
    // Verify signature
    const isValid = this.squareClient.verifyWebhookSignature(JSON.stringify(event), signature, url);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    if (event.type === 'payment.completed') {
      const payment = event.data.object.payment;
      if (!payment) return;

      // Find transaction by order ID or reference
      // Since we don't have the order ID mapping easily, we might rely on metadata
      // But Square Payment Links don't always pass metadata to the payment object easily
      // We'll need to rely on the payment reference_id if we set it, or order_id

      // For MVP, we'll assume we can match by ID if we stored the checkout ID
      // Or we just log it for now since we don't have the full order mapping implemented
      console.warn('Payment completed:', payment.id, payment.amount_money.amount);

      // TODO: Implement full reconciliation
      // 1. Find transaction with status 'pending' and matching amount/user
      // 2. Update status to 'completed'
      // 3. Trigger fulfillment (activate subscription, topup wallet, etc.)
    }
  }
}
