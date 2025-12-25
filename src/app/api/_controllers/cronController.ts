import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CronService } from '@/services/cron/cronService';

const cronService = new CronService();
const CRON_SECRET = process.env['CRON_SECRET'] || '';

function authorizeCron(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}` && CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export const cronController = {
  async dailyTasks(request: NextRequest) {
    const auth = authorizeCron(request);
    if (auth) return auth;

    const now = new Date();
    try {
      const results = await cronService.runDailyTasks(now);
      return NextResponse.json({ success: true, timestamp: now.toISOString(), results });
    } catch (err) {
      console.error('Daily tasks cron job error:', err);
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: now.toISOString(),
        },
        { status: 500 }
      );
    }
  },

  async payouts(request: NextRequest) {
    const auth = authorizeCron(request);
    if (auth) return auth;

    try {
      const results = await cronService.runWeeklyPayouts();
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        results,
        note: 'Payouts created. Actual payment processing via gateway is pending implementation.',
      });
    } catch (err) {
      console.error('Payout cron job error:', err);
      return NextResponse.json(
        {
          error: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  },

  // Legacy endpoints kept for compatibility; route handlers should still call one controller.
  async subscriptionRenewals(request: NextRequest) {
    return this.dailyTasks(request);
  },

  async publishScheduledPosts(request: NextRequest) {
    return this.dailyTasks(request);
  },
};
