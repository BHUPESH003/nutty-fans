import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

// NOTE: This is a simple in-memory limiter for local/dev use only.
// In QA/PROD this must be backed by a shared store (e.g. Redis) via a future infra task.
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function withRateLimit(
  handler: (_req: NextRequest) => Promise<NextResponse>, // eslint-disable-line no-unused-vars
  config: RateLimitConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();

    const existing = memoryStore.get(key);
    if (!existing || existing.resetAt < now) {
      memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    } else {
      existing.count += 1;
      if (existing.count > config.max) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }

    return handler(req);
  };
}
