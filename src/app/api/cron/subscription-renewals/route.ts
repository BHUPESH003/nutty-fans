/**
 * Subscription Renewal Cron Job
 *
 * Runs every 6 hours to process subscription renewals
 * Checks for subscriptions expiring within 24 hours and processes renewals
 */

import type { NextRequest } from 'next/server';

import { cronController } from '@/app/api/_controllers/cronController';

export async function GET(request: NextRequest) {
  return cronController.subscriptionRenewals(request);
}
