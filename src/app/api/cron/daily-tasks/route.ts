/**
 * Daily Tasks Cron Job
 *
 * Runs once per day to handle:
 * 1. Subscription renewals (processes subscriptions expiring within 24 hours)
 * 2. Scheduled post publishing (publishes posts whose scheduledAt time has passed)
 *
 * This combined approach is necessary for Vercel Hobby plan which limits to 2 cron jobs
 * that can run at most once per day.
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { SubscriptionService } from '@/services/payments/subscriptionService';

const subscriptionService = new SubscriptionService();

// Authorization header for cron jobs
const CRON_SECRET = process.env['CRON_SECRET'] || '';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}` && CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = {
    subscriptionRenewals: {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    },
    scheduledPosts: {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    },
  };

  try {
    // ============================================
    // 1. Process Subscription Renewals
    // ============================================
    try {
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

      // Process each subscription renewal
      for (const subscription of eligibleSubscriptions) {
        try {
          const result = await subscriptionService.processRenewal(subscription.id);
          results.subscriptionRenewals.processed++;

          if (result.success) {
            results.subscriptionRenewals.succeeded++;
          } else {
            results.subscriptionRenewals.failed++;
            if (result.error) {
              results.subscriptionRenewals.errors.push(
                `Subscription ${subscription.id}: ${result.error}`
              );
            }
          }
        } catch (error) {
          results.subscriptionRenewals.failed++;
          results.subscriptionRenewals.errors.push(
            `Subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      results.subscriptionRenewals.errors.push(
        `Subscription renewal processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // ============================================
    // 2. Publish Scheduled Posts
    // ============================================
    try {
      // Find all scheduled posts where scheduledAt has passed
      const scheduledPosts = await prisma.post.findMany({
        where: {
          status: 'scheduled',
          scheduledAt: {
            lte: now,
            not: null,
          },
        },
        take: 50, // Process in batches
        select: {
          id: true,
          creatorId: true,
          scheduledAt: true,
        },
      });

      // Publish each scheduled post
      for (const post of scheduledPosts) {
        try {
          await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'published',
              publishedAt: post.scheduledAt || now,
              scheduledAt: null, // Clear scheduledAt after publishing
            },
          });

          results.scheduledPosts.succeeded++;
          results.scheduledPosts.processed++;
        } catch (error) {
          results.scheduledPosts.failed++;
          results.scheduledPosts.errors.push(
            `Post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      results.scheduledPosts.errors.push(
        `Scheduled post processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Daily tasks cron job error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: now.toISOString(),
        results,
      },
      { status: 500 }
    );
  }
}
