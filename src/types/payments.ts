/**
 * Payment System Types
 * Types for subscriptions, transactions, wallet, PPV, tips, payouts
 */

// ============================================
// ENUMS (Mirror Prisma)
// ============================================

export type SubscriptionPlanType = 'monthly' | 'threemonth' | 'sixmonth' | 'twelvemonth';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'paused';
export type TransactionType =
  | 'subscription'
  | 'ppv'
  | 'tip'
  | 'message'
  | 'live_tip'
  | 'wallet_topup'
  | 'payout'
  | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================
// CONSTANTS
// ============================================

export const PLATFORM_COMMISSION_RATE = 0.16; // 16%
export const CREATOR_EARNINGS_RATE = 0.84; // 84%
export const MINIMUM_PAYOUT_AMOUNT = 20; // $20
export const MINIMUM_WALLET_TOPUP = 5; // $5

export const PLAN_DISCOUNTS: Record<SubscriptionPlanType, number> = {
  monthly: 0,
  threemonth: 0.1, // 10% discount
  sixmonth: 0.2, // 20% discount
  twelvemonth: 0.3, // 30% discount
};

export const PLAN_MONTHS: Record<SubscriptionPlanType, number> = {
  monthly: 1,
  threemonth: 3,
  sixmonth: 6,
  twelvemonth: 12,
};

// ============================================
// SUBSCRIPTION
// ============================================

export interface SubscriptionPlan {
  planType: SubscriptionPlanType;
  months: number;
  basePrice: number;
  discount: number;
  finalPrice: number;
}

export interface SubscribeInput {
  planType?: SubscriptionPlanType;
  paymentSource?: 'card' | 'wallet';
}

export interface SubscriptionWithCreator {
  id: string;
  userId: string;
  creatorId: string;
  planType: SubscriptionPlanType;
  pricePaid: number;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date;
  cancelledAt: Date | null;
  autoRenew: boolean;
  creator: {
    id: string;
    handle: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

// ============================================
// TRANSACTION
// ============================================

export interface TransactionRecord {
  id: string;
  userId: string;
  creatorId: string | null;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  platformFee: number | null;
  creatorEarnings: number | null;
  status: TransactionStatus;
  relatedId: string | null;
  relatedType: string | null;
  description: string | null;
  createdAt: Date;
}

export interface CreateTransactionInput {
  userId: string;
  creatorId?: string;
  transactionType: TransactionType;
  amount: number;
  relatedId?: string;
  relatedType?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// WALLET
// ============================================

export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
}

export interface TopupInput {
  amount: number;
  paymentMethodId?: string;
}

// ============================================
// PPV
// ============================================

export interface PpvPurchaseRecord {
  id: string;
  userId: string;
  postId: string;
  pricePaid: number;
  createdAt: Date;
  post?: {
    id: string;
    content: string | null;
    thumbnailUrl: string | null;
  };
}

export interface PurchasePpvInput {
  paymentSource: 'card' | 'wallet';
}

// ============================================
// TIP
// ============================================

export interface SendTipInput {
  creatorId: string;
  amount: number;
  message?: string;
  relatedType?: 'post' | 'message';
  relatedId?: string;
  paymentSource: 'card' | 'wallet';
}

// ============================================
// PAYOUT
// ============================================

export interface PayoutRecord {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  payoutMethod: string;
  periodStart: Date;
  periodEnd: Date;
  transactionsCount: number;
  failureReason: string | null;
  processedAt: Date | null;
  createdAt: Date;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingPayout: number;
  lifetimeEarnings: number;
  transactionCount: number;
  byType: Record<string, number>;
}

export interface PayoutSettings {
  minimumAmount: number;
  autoPayoutEnabled: boolean;
  payoutDay: 'friday';
}

// ============================================
// CHECKOUT
// ============================================

export interface CheckoutParams {
  userId: string;
  amount: number;
  currency?: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    basePriceMoney: { amount: number; currency: string };
  }>;
  redirectUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  checkoutId: string;
  checkoutUrl: string;
}

// ============================================
// SQUARE WEBHOOK
// ============================================

export interface SquarePaymentWebhookEvent {
  type: 'payment.completed' | 'payment.failed' | 'refund.created' | 'payout.paid';
  data: {
    id: string;
    object: {
      payment?: {
        id: string;
        status: string;
        amount_money: { amount: number; currency: string };
        order_id?: string;
        reference_id?: string;
      };
      refund?: {
        id: string;
        payment_id: string;
        amount_money: { amount: number; currency: string };
      };
      payout?: {
        id: string;
        status: string;
        amount: { amount: number; currency: string };
      };
    };
  };
}

// ============================================
// PAGINATION
// ============================================

export interface PaginatedSubscriptions {
  subscriptions: SubscriptionWithCreator[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedTransactions {
  transactions: TransactionRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedPayouts {
  payouts: PayoutRecord[];
  nextCursor: string | null;
  hasMore: boolean;
}
