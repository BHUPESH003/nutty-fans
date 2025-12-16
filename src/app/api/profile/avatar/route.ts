import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { avatarController } from '@/app/api/_controllers/avatarController';
import { withRateLimit } from '@/lib/middleware/rateLimit';

async function handler(req: NextRequest) {
  if (req.method !== 'DELETE') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }
  return avatarController.remove();
}

export const DELETE = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 20,
});
