import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { UserRepository } from '@/repositories/userRepository';
import { VerificationTokenRepository } from '@/repositories/verificationTokenRepository';
import { TokenService } from '@/services/auth/tokenService';

async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  const { token } = (await req.json()) ?? {};
  if (!token || typeof token !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing token' },
      { status: 400 }
    );
  }

  const tokenService = new TokenService(new VerificationTokenRepository());
  const userRepo = new UserRepository();

  const record = await tokenService.consumeToken(token, 'email_verify');
  if (!record) {
    // Generic message to avoid information leaks
    return NextResponse.json(
      { success: false, error: 'Invalid or expired verification link' },
      { status: 400 }
    );
  }

  const user = await userRepo.findById(record.userId);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired verification link' },
      { status: 400 }
    );
  }

  // Mark email as verified and update accountState.
  const metadata = (user.metadata ?? {}) as Record<string, unknown>;
  const existingAuthState = (metadata['authState'] as Record<string, unknown>) ?? {};
  const nextMetadata = {
    ...metadata,
    authState: {
      ...existingAuthState,
      accountState: 'active',
    },
  } as unknown;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      metadata: nextMetadata as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  });

  return NextResponse.json({ success: true, accountState: 'active' });
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 50,
});
