import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
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
    try {
      const result = await subscriptionService.subscribe(userId, creatorId, { planType });
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to subscribe';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async getSubscriptions(userId: string, cursor?: string) {
    try {
      const result = await subscriptionService.getUserSubscriptions(userId, cursor);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get subscriptions';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async cancelSubscription(subscriptionId: string, userId: string) {
    try {
      await subscriptionService.cancel(subscriptionId, userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async renewSubscription(subscriptionId: string, planType?: SubscriptionPlanType) {
    try {
      const result = await subscriptionService.renew(subscriptionId, planType);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to renew subscription';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async getCreatorSubscribers(creatorId: string, cursor?: string) {
    try {
      const result = await subscriptionService.getCreatorSubscribers(creatorId, cursor);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get subscribers';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async getSubscriptionPlans(creatorId: string) {
    try {
      const plans = await subscriptionService.getPlans(creatorId);
      return NextResponse.json({ plans });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get plans';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // WALLET
  // ============================================

  async getWalletBalance(userId: string) {
    try {
      const balance = await walletService.getBalance(userId);
      return NextResponse.json(balance);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get balance';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async topupWallet(userId: string, amount: number) {
    try {
      const result = await walletService.topup(userId, amount);
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to top up wallet';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async getWalletTransactions(userId: string, cursor?: string) {
    try {
      const result = await walletService.getTransactions(userId, cursor);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get transactions';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // PPV
  // ============================================

  async purchasePpv(userId: string, postId: string, paymentSource: 'wallet' | 'card') {
    try {
      const result = await ppvService.purchase(userId, postId, { paymentSource });
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to purchase';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async getPpvPurchases(userId: string, cursor?: string) {
    try {
      const result = await ppvService.getUserPurchases(userId, cursor);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get purchases';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // TIPS
  // ============================================

  async sendTip(userId: string, input: SendTipInput) {
    try {
      const result = await tipService.sendTip(userId, input);
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send tip';
      return NextResponse.json({ error: { message } }, { status: 400 });
    }
  },

  async getReceivedTips(creatorId: string, cursor?: string) {
    try {
      const result = await tipService.getReceivedTips(creatorId, cursor);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get tips';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // TRANSACTIONS
  // ============================================

  async getUserTransactions(userId: string, cursor?: string, type?: string) {
    try {
      const result = await transactionService.getUserTransactions(
        userId,
        type ? { type: type as 'subscription' | 'ppv' | 'tip' } : undefined,
        cursor
      );
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get transactions';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async getCreatorTransactions(creatorId: string, cursor?: string) {
    try {
      const result = await transactionService.getCreatorTransactions(creatorId, undefined, cursor);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get transactions';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async exportTransactions(userId: string, isCreator: boolean) {
    try {
      const csv = await transactionService.exportToCsv(userId, isCreator);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="transactions.csv"',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  // ============================================
  // PAYOUTS
  // ============================================

  async getEarnings(creatorId: string) {
    try {
      const earnings = await payoutService.getEarningsSummary(creatorId);
      const nextPayoutDate = payoutService.getNextPayoutDate();
      return NextResponse.json({ ...earnings, nextPayoutDate });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get earnings';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async getPayouts(creatorId: string, cursor?: string) {
    try {
      const result = await payoutService.getPayouts(creatorId, cursor);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get payouts';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
  },

  async getPayoutSettings(creatorId: string) {
    try {
      const settings = await payoutService.getSettings(creatorId);
      return NextResponse.json(settings);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get settings';
      return NextResponse.json({ error: { message } }, { status: 500 });
    }
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
