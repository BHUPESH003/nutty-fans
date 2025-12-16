import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authController } from '@/app/api/_controllers/authController';
import { withRateLimit } from '@/lib/middleware/rateLimit';

async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }
  return authController.register(req);
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 20,
});
