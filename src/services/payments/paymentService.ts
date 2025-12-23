/**
 * Unified Payment Service
 *
 * SINGLE ENTRY POINT for all payment operations in the platform.
 * Enforces closed-loop wallet model:
 * - All features MUST use this service
 * - All debits go through wallet
 * - Gateway is only used for wallet funding
 *
 * STRICT RULES:
 * - No feature may call the gateway directly
 * - No card payments bypass the wallet
 * - Commission is always applied at debit time
 */

import type { TransactionType } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { transactionService } from '@/services/finance/transactionService';
import type { PaymentGatewayAdapter } from '@/services/gateways';
import { squareAdapter } from '@/services/gateways';

// ============================================
// TYPES
// ============================================

export interface DebitParams {
  /** Transaction type */
  transactionType: TransactionType;
  /** Amount to debit */
  amount: number;
  /** Creator receiving funds (for tip/subscription/ppv) */
  creatorId: string;
  /** Related entity ID (subscription ID, post ID, etc.) */
  relatedId?: string;
  /** Related entity type */
  relatedType?: string;
  /** Description */
  description?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface TopUpResult {
  /** Checkout URL for user redirect */
  checkoutUrl: string;
  /** Checkout ID for tracking */
  checkoutId: string;
}

export interface DebitResult {
  /** Transaction ID */
  transactionId: string;
  /** Amount debited */
  amount: number;
  /** Platform fee applied */
  platformFee: number;
  /** Creator earnings after commission */
  creatorEarnings: number;
  /** New wallet balance */
  newBalance: number;
}

export interface AutoTopUpSettings {
  /** Whether auto top-up is enabled */
  enabled: boolean;
  /** Saved payment method ID */
  paymentMethodId?: string;
  /** Fixed top-up amount */
  topUpAmount: number;
}

// Fixed auto top-up amounts (user must choose one)
export const AUTO_TOPUP_AMOUNTS = [10, 25, 50, 100] as const;
export type AutoTopUpAmount = (typeof AUTO_TOPUP_AMOUNTS)[number];

// Grace period for failed subscription renewals (in days)
export const SUBSCRIPTION_GRACE_PERIOD_DAYS = 3;

// Maximum auto top-up retry attempts
export const MAX_AUTO_TOPUP_RETRIES = 3;

// ============================================
// PAYMENT SERVICE
// ============================================

export class PaymentService {
  private gateway: PaymentGatewayAdapter;

  constructor(gateway: PaymentGatewayAdapter = squareAdapter) {
    this.gateway = gateway;
  }

  // ============================================
  // WALLET TOP-UP (Manual)
  // ============================================

  /**
   * Create a checkout session for manual wallet top-up
   * User is redirected to payment gateway
   */
  async topUpWallet(
    userId: string,
    amount: number,
    successUrl: string,
    cancelUrl: string
  ): Promise<TopUpResult> {
    if (amount < 5) {
      throw new Error('Minimum top-up amount is $5');
    }

    if (amount > 500) {
      throw new Error('Maximum top-up amount is $500');
    }

    const result = await this.gateway.createTopUpCheckout({
      userId,
      amount,
      successUrl,
      cancelUrl,
      idempotencyKey: `topup-${userId}-${Date.now()}`,
      metadata: { type: 'manual_topup' },
    });

    // Create pending transaction
    await transactionService.createTransaction(
      {
        userId,
        transactionType: 'wallet_topup',
        amount,
        description: 'Wallet top-up (pending)',
        metadata: { checkoutId: result.checkoutId, source: 'manual' },
      },
      { skipCommission: true }
    );

    return {
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
    };
  }

  /**
   * Complete wallet top-up after successful payment (called from webhook)
   */
  async completeTopUp(userId: string, amount: number, paymentId: string): Promise<void> {
    // Idempotency check - find if we already processed this payment
    const existing = await prisma.transaction.findFirst({
      where: {
        userId,
        transactionType: 'wallet_topup',
        metadata: { path: ['paymentId'], equals: paymentId },
        status: 'completed',
      },
    });

    if (existing) {
      console.warn(`Top-up already completed for payment ${paymentId}`);
      return;
    }

    // Create completed transaction (or update pending one)
    await transactionService.createTransaction(
      {
        userId,
        transactionType: 'wallet_topup',
        amount,
        description: 'Wallet top-up',
        metadata: { paymentId, source: 'manual' },
      },
      { skipCommission: true, status: 'completed', stripePaymentId: paymentId }
    );
  }

  // ============================================
  // WALLET DEBIT
  // ============================================

  /**
   * Debit wallet for any feature (subscription, tip, PPV, etc.)
   * This is the ONLY way features should charge users
   */
  async debitWallet(userId: string, params: DebitParams): Promise<DebitResult> {
    // Check wallet balance
    const balance = await this.getWalletBalance(userId);

    if (balance < params.amount) {
      throw new Error(
        `Insufficient wallet balance. Required: $${params.amount.toFixed(2)}, Available: $${balance.toFixed(2)}`
      );
    }

    // Create transaction with commission
    const result = await transactionService.createTransaction(
      {
        userId,
        creatorId: params.creatorId,
        transactionType: params.transactionType,
        amount: params.amount,
        relatedId: params.relatedId,
        relatedType: params.relatedType,
        description: params.description,
        metadata: { ...params.metadata, paidWithWallet: true },
      },
      { status: 'completed' }
    );

    const newBalance = await this.getWalletBalance(userId);

    return {
      transactionId: result.transactionId,
      amount: result.amount,
      platformFee: result.platformFee ?? 0,
      creatorEarnings: result.creatorEarnings ?? 0,
      newBalance,
    };
  }

  // ============================================
  // AUTO TOP-UP (Subscriptions Only)
  // ============================================

  /**
   * Attempt auto top-up for subscription renewal
   * ONLY called from subscription renewal logic
   *
   * @returns true if top-up succeeded, false otherwise
   */
  async attemptAutoTopUp(
    userId: string,
    requiredAmount: number
  ): Promise<{ success: boolean; error?: string }> {
    // Get user's auto top-up settings
    const settings = await this.getAutoTopUpSettings(userId);

    if (!settings.enabled || !settings.paymentMethodId) {
      return { success: false, error: 'Auto top-up not enabled' };
    }

    // Check if retry limit exceeded (use metadata to track)
    const recentAttempts = await prisma.transaction.count({
      where: {
        userId,
        transactionType: 'wallet_topup',
        metadata: { path: ['source'], equals: 'auto_topup' },
        status: 'failed',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
    });

    if (recentAttempts >= MAX_AUTO_TOPUP_RETRIES) {
      return { success: false, error: 'Maximum auto top-up attempts exceeded' };
    }

    // Use fixed top-up amount (not the exact required amount)
    const topUpAmount = settings.topUpAmount;
    if (topUpAmount < requiredAmount) {
      return {
        success: false,
        error: `Top-up amount ($${topUpAmount}) less than required ($${requiredAmount})`,
      };
    }

    const idempotencyKey = `auto-topup-${userId}-${Date.now()}`;

    try {
      const chargeResult = await this.gateway.chargePaymentMethod(
        settings.paymentMethodId,
        topUpAmount,
        idempotencyKey
      );

      if (chargeResult.status === 'succeeded') {
        // Record successful top-up
        await this.completeTopUp(userId, topUpAmount, chargeResult.paymentId);
        return { success: true };
      } else {
        // Record failed attempt
        await this.recordFailedAutoTopUp(userId, topUpAmount, chargeResult.errorMessage);
        return { success: false, error: chargeResult.errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.recordFailedAutoTopUp(userId, topUpAmount, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private async recordFailedAutoTopUp(
    userId: string,
    amount: number,
    error?: string
  ): Promise<void> {
    await transactionService.createTransaction(
      {
        userId,
        transactionType: 'wallet_topup',
        amount,
        description: `Auto top-up failed: ${error}`,
        metadata: { source: 'auto_topup', error },
      },
      { skipCommission: true, status: 'failed' }
    );
  }

  // ============================================
  // AUTO TOP-UP SETTINGS
  // ============================================

  /**
   * Get user's auto top-up settings
   */
  async getAutoTopUpSettings(userId: string): Promise<AutoTopUpSettings> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });

    const metadata = (user?.metadata as Record<string, unknown>) ?? {};
    const autoTopUp = (metadata['autoTopUp'] as Record<string, unknown>) ?? {};

    return {
      enabled: Boolean(autoTopUp['enabled']),
      paymentMethodId: autoTopUp['paymentMethodId'] as string | undefined,
      topUpAmount: (autoTopUp['amount'] as number) ?? 25,
    };
  }

  /**
   * Update user's auto top-up settings
   */
  async updateAutoTopUpSettings(
    userId: string,
    enabled: boolean,
    paymentMethodId?: string,
    topUpAmount?: AutoTopUpAmount
  ): Promise<void> {
    if (topUpAmount && !AUTO_TOPUP_AMOUNTS.includes(topUpAmount)) {
      throw new Error(`Invalid top-up amount. Must be one of: ${AUTO_TOPUP_AMOUNTS.join(', ')}`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    });

    const currentMetadata = (user?.metadata as Record<string, unknown>) ?? {};

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...currentMetadata,
          autoTopUp: {
            enabled,
            paymentMethodId,
            amount: topUpAmount ?? 25,
          },
        },
      },
    });
  }

  // ============================================
  // WALLET BALANCE
  // ============================================

  /**
   * Get current wallet balance (derived from ledger)
   */
  async getWalletBalance(userId: string): Promise<number> {
    // Sum of completed top-ups
    const topups = await prisma.transaction.aggregate({
      where: {
        userId,
        transactionType: 'wallet_topup',
        status: 'completed',
      },
      _sum: { amount: true },
    });

    // Sum of wallet debits
    const debits = await prisma.transaction.aggregate({
      where: {
        userId,
        status: 'completed',
        metadata: {
          path: ['paidWithWallet'],
          equals: true,
        },
      },
      _sum: { amount: true },
    });

    const topupTotal = topups._sum.amount?.toNumber() ?? 0;
    const debitTotal = debits._sum.amount?.toNumber() ?? 0;

    return Math.max(0, topupTotal - debitTotal);
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getWalletBalance(userId);
    return balance >= amount;
  }

  // ============================================
  // REFUND (Admin Only)
  // ============================================

  /**
   * Refund a transaction (admin only)
   * Credits wallet, does NOT refund to card
   */
  async refundToWallet(transactionId: string, reason: string, adminUserId: string): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'refunded') {
      throw new Error('Transaction already refunded');
    }

    // Create refund transaction (wallet credit)
    await transactionService.createTransaction(
      {
        userId: transaction.userId,
        transactionType: 'refund',
        amount: transaction.amount.toNumber(),
        description: `Refund: ${reason}`,
        relatedId: transactionId,
        relatedType: 'refund',
        metadata: {
          originalTransactionId: transactionId,
          refundReason: reason,
          refundedBy: adminUserId,
          paidWithWallet: false, // This is a CREDIT, not a debit
        },
      },
      { skipCommission: true, status: 'completed' }
    );

    // Mark original transaction as refunded
    await transactionService.refundTransaction(transactionId);
  }
}

// Singleton instance
export const paymentService = new PaymentService();
