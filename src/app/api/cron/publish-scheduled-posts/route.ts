/**
 * Scheduled Post Publishing Cron Job
 *
 * Runs every minute to publish scheduled posts whose scheduledAt time has passed
 */

import type { NextRequest } from 'next/server';

import { cronController } from '@/app/api/_controllers/cronController';

export async function GET(request: NextRequest) {
  return cronController.publishScheduledPosts(request);
}
