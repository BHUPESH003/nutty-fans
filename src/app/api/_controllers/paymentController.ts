import { NextResponse } from 'next/server';

import { successResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import {
  AppError,
  handleAsyncRoute,
  VALIDATION_MISSING_FIELD,
  VALIDATION_ERROR,
} from '@/lib/errors/errorHandler';
import { PayoutService } from '@/services/payments/payoutService';
import { PpvService } from '@/services/payments/ppvService';
import { SubscriptionService } from '@/services/payments/subscriptionService';
import { TipService } from '@/services/payments/tipService';
import { TransactionService } from '@/services/payments/transactionService';
import { WalletService } from '@/services/payments/walletService';
import type { SubscriptionPlanType, SendTipInput } from '@/types/payments';

const subscriptionService = new SubscriptionService();
const walletService = new WalletService();
const ppvService = new PpvService();
const tipService = new TipService();
const payoutService = new PayoutService();
const transactionService = new TransactionService();

export const paymentController = {
  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  async subscribe(creatorId: string, userId: string, planType?: SubscriptionPlanType) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const result = await subscriptionService.subscribe(userId, creatorId, planType);
      return successResponse(result, 'Subscribed successfully', 201);
    });
  },

  async getSubscriptions(userId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      const result = await subscriptionService.getUserSubscriptions(userId, cursor);
      return successResponse(result);
    });
  },

  async cancelSubscription(subscriptionId: string, userId: string) {
    return handleAsyncRoute(async () => {
      if (!subscriptionId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Subscription ID is required', 400);
      }
      await subscriptionService.cancel(subscriptionId, userId);
      return successResponse({ success: true });
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  async renewSubscription(subscriptionId: string, userId: string, planType?: SubscriptionPlanType) {
    return handleAsyncRoute(async () => {
      if (!subscriptionId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Subscription ID is required', 400);
      }
      // Renewal is now handled by scheduled job - manual renewal not supported
      throw new AppError(
        VALIDATION_ERROR,
        'Manual renewal not supported. Subscriptions renew automatically.',
        400
      );
    });
  },

  async getCreatorSubscribers(creatorId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const result = await subscriptionService.getCreatorSubscribers(creatorId, cursor);
      return successResponse(result);
    });
  },

  async getSubscriptionPlans(creatorId: string) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const plans = await subscriptionService.getPlans(creatorId);
      return successResponse({ plans });
    });
  },

  // ============================================
  // WALLET
  // ============================================

  async getWalletBalance(userId: string) {
    return handleAsyncRoute(async () => {
      const balance = await walletService.getBalance(userId);
      return successResponse(balance);
    });
  },

  async topupWallet(userId: string, amount: number) {
    return handleAsyncRoute(async () => {
      if (!amount || amount <= 0) {
        throw new AppError(VALIDATION_ERROR, 'Amount must be greater than 0', 400);
      }
      const result = await walletService.topup(userId, amount);
      return successResponse(result, 'Wallet topped up successfully', 201);
    });
  },

  async getWalletTransactions(userId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      const result = await walletService.getTransactions(userId, cursor);
      return successResponse(result);
    });
  },

  // ============================================
  // PPV
  // ============================================

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  async purchasePpv(userId: string, postId: string, paymentSource: 'wallet' | 'card') {
    return handleAsyncRoute(async () => {
      if (!postId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Post ID is required', 400);
      }
      // Wallet-only - paymentSource parameter ignored
      const result = await ppvService.purchase(userId, postId);
      return successResponse(result, 'PPV purchased successfully', 201);
    });
  },

  async getPpvPurchases(userId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      const result = await ppvService.getUserPurchases(userId, cursor);
      return successResponse(result);
    });
  },

  // ============================================
  // TIPS
  // ============================================

  async sendTip(userId: string, input: SendTipInput) {
    return handleAsyncRoute(async () => {
      if (!input.creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      if (!input.amount || input.amount <= 0) {
        throw new AppError(VALIDATION_ERROR, 'Tip amount must be greater than 0', 400);
      }
      const result = await tipService.sendTip(userId, input);
      return successResponse(result, 'Tip sent successfully', 201);
    });
  },

  async getReceivedTips(creatorId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const result = await tipService.getReceivedTips(creatorId, cursor);
      return successResponse(result);
    });
  },

  // ============================================
  // TRANSACTIONS
  // ============================================

  async getUserTransactions(userId: string, cursor?: string, type?: string) {
    return handleAsyncRoute(async () => {
      const result = await transactionService.getUserTransactions(
        userId,
        type ? { type: type as 'subscription' | 'ppv' | 'tip' } : undefined,
        cursor
      );
      return successResponse(result);
    });
  },

  async getCreatorTransactions(creatorId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const result = await transactionService.getCreatorTransactions(creatorId, undefined, cursor);
      return successResponse(result);
    });
  },

  async exportTransactions(userId: string, isCreator: boolean) {
    return handleAsyncRoute(async () => {
      const csv = await transactionService.exportToCsv(userId, isCreator);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="transactions.csv"',
        },
      });
    });
  },

  // ============================================
  // PAYOUTS
  // ============================================

  async getEarnings(creatorId: string) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const earnings = await payoutService.getEarningsSummary(creatorId);
      const nextPayoutDate = payoutService.getNextPayoutDate();
      return successResponse({ ...earnings, nextPayoutDate });
    });
  },

  async getPayouts(creatorId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const result = await payoutService.getPayouts(creatorId, cursor);
      return successResponse(result);
    });
  },

  async getPayoutSettings(creatorId: string) {
    return handleAsyncRoute(async () => {
      if (!creatorId) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Creator ID is required', 400);
      }
      const settings = await payoutService.getSettings(creatorId);
      return successResponse(settings);
    });
  },

  // ============================================
  // HELPERS
  // ============================================

  async getCreatorProfile(userId: string) {
    return prisma.creatorProfile.findFirst({
      where: { userId },
      select: { id: true },
    });
  },
};
