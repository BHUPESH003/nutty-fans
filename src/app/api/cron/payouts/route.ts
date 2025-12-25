/**
 * Weekly Payout Processing Cron Job
 *
 * Runs every Friday at 9 AM UTC to process creator payouts
 * Processes payouts for all creators with pending earnings above minimum threshold
 */

import type { NextRequest } from 'next/server';

import { cronController } from '@/app/api/_controllers/cronController';

export async function GET(request: NextRequest) {
  return cronController.payouts(request);
}
