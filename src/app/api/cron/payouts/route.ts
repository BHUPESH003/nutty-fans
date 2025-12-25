/**
 * Weekly Payout Processing Cron Job
 *
 * Runs every Friday at 9 AM UTC to process creator payouts
 * Processes payouts for all creators with pending earnings above minimum threshold
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { PayoutService } from '@/services/payments/payoutService';

const payoutService = new PayoutService();

// Authorization header for cron jobs
const CRON_SECRET = process.env['CRON_SECRET'] || '';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}` && CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active creators (those who have completed KYC and are active)
    // The payoutService.createPayout will check if they have enough pending earnings
    const activeCreators = await prisma.creatorProfile.findMany({
      where: {
        onboardingStatus: 'active',
      },
      select: {
        id: true,
        userId: true,
      },
    });

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      payoutsCreated: [] as Array<{ creatorId: string; payoutId: string; amount: number }>,
      errors: [] as string[],
    };

    // Process payouts for each creator
    for (const creator of activeCreators) {
      try {
        const payoutResult = await payoutService.createPayout(creator.id);

        if (payoutResult) {
          results.succeeded++;
          results.payoutsCreated.push({
            creatorId: creator.id,
            payoutId: payoutResult.id,
            amount: payoutResult.amount,
          });
        } else {
          // Below minimum threshold, skip
          continue;
        }

        results.processed++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Creator ${creator.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // TODO: Process actual payouts via payment gateway (Square/Stripe)
    // This would involve:
    // 1. Getting creator payout settings (bank account, etc.)
    // 2. Initiating transfer via payment gateway
    // 3. Updating payout status based on gateway response
    // 4. Handling failures and retries

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      note: 'Payouts created. Actual payment processing via gateway is pending implementation.',
    });
  } catch (error) {
    console.error('Payout cron job error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
