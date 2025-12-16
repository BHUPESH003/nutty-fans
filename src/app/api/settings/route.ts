import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { settingsController } from '@/app/api/_controllers/settingsController';
import { withRateLimit } from '@/lib/middleware/rateLimit';

export async function GET() {
  return settingsController.get();
}

async function handler(req: NextRequest) {
  if (req.method !== 'PATCH') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }
  return settingsController.update(req);
}

export const PATCH = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 60,
});
