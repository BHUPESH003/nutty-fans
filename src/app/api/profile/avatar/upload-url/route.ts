import type { NextRequest } from 'next/server';

import { avatarController } from '@/app/api/_controllers/avatarController';
import { withRateLimit } from '@/lib/middleware/rateLimit';

async function handler(req: NextRequest) {
  return avatarController.uploadUrl(req);
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 20,
});
