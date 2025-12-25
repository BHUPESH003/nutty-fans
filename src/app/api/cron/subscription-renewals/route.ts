/**
 * Subscription Renewal Cron Job
 *
 * Runs every 6 hours to process subscription renewals
 * Checks for subscriptions expiring within 24 hours and processes renewals
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { SubscriptionService } from '@/services/payments/subscriptionService';

const subscriptionService = new SubscriptionService();

// Authorization header for cron jobs (set in Vercel env vars)
const CRON_SECRET = process.env['CRON_SECRET'] || '';

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel provides this, but we can add our own)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}` && CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const renewalWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Find subscriptions that are:
    // 1. Active
    // 2. Auto-renew enabled
    // 3. Expiring within 24 hours
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        autoRenew: true,
        expiresAt: {
          lte: renewalWindow,
          gt: now,
        },
      },
      take: 100, // Process in batches
    });

    // Filter out subscriptions already in grace period
    const eligibleSubscriptions = expiringSubscriptions.filter((sub) => {
      const metadata = sub.metadata as Record<string, unknown> | null;
      return !metadata?.['gracePeriodStart'];
    });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each subscription renewal
    for (const subscription of eligibleSubscriptions) {
      try {
        const result = await subscriptionService.processRenewal(subscription.id);
        results.processed++;

        if (result.success) {
          results.succeeded++;
        } else {
          results.failed++;
          if (result.error) {
            results.errors.push(`Subscription ${subscription.id}: ${result.error}`);
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Subscription renewal cron job error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
