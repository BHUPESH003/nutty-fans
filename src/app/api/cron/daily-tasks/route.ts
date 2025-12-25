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

import type { NextRequest } from 'next/server';

import { cronController } from '@/app/api/_controllers/cronController';

export async function GET(request: NextRequest) {
  return cronController.dailyTasks(request);
}
