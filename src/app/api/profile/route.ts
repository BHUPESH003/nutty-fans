import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { profileController } from '@/app/api/_controllers/profileController';
import { withRateLimit } from '@/lib/middleware/rateLimit';

async function handler(req: NextRequest) {
  if (req.method !== 'PATCH') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }
  return profileController.update(req);
}

export const PATCH = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 20,
});
