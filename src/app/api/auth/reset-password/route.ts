import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withRateLimit } from '@/lib/middleware/rateLimit';
import { hashPassword } from '@/lib/security/hash';
import { validatePassword } from '@/lib/security/passwordPolicy';
import { UserRepository } from '@/repositories/userRepository';
import { VerificationTokenRepository } from '@/repositories/verificationTokenRepository';
import { SessionService } from '@/services/auth/sessionService';
import { TokenService } from '@/services/auth/tokenService';

async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  const { token, newPassword } = (await req.json()) ?? {};
  if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Invalid token or password' },
      { status: 400 }
    );
  }

  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: 'Password does not meet policy requirements' },
      { status: 400 }
    );
  }

  const tokenService = new TokenService(new VerificationTokenRepository());
  const record = await tokenService.consumeToken(token, 'password_reset');
  if (!record) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired reset link' },
      { status: 400 }
    );
  }

  const userRepo = new UserRepository();
  const user = await userRepo.findById(record.userId);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired reset link' },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepo.updatePasswordHash(user.id, passwordHash);

  const sessionService = new SessionService();
  await sessionService.invalidateAllUserSessions(user.id);

  return NextResponse.json({ success: true });
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 20,
});
