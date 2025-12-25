import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { emailVerificationController } from '@/app/api/_controllers/emailVerificationController';
import { withRateLimit } from '@/lib/middleware/rateLimit';

async function handler(req: NextRequest): Promise<NextResponse> {
  return emailVerificationController.verify(req);
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 50,
});
