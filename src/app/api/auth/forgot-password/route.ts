import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withRateLimit } from '@/lib/middleware/rateLimit';
import { UserRepository } from '@/repositories/userRepository';
import { VerificationTokenRepository } from '@/repositories/verificationTokenRepository';
import { EmailService } from '@/services/auth/emailService';
import { TokenService } from '@/services/auth/tokenService';

async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }

  const { email } = (await req.json()) ?? {};
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ message: 'If an account exists, a reset link was sent.' });
  }

  const userRepo = new UserRepository();
  const user = await userRepo.findByEmail(email.toLowerCase());

  if (user) {
    const tokenService = new TokenService(new VerificationTokenRepository());
    const token = await tokenService.createToken({
      userId: user.id,
      type: 'password_reset',
      ttlMs: 60 * 60 * 1000, // 1 hour
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: req.headers.get('user-agent'),
    });

    // Send reset email via emailService
    const emailService = new EmailService();
    await emailService.sendPasswordResetEmail({
      email: user.email,
      token: token.token,
    });
  }

  // Response is always generic to prevent account enumeration
  return NextResponse.json({
    message: 'If an account exists, a reset link was sent.',
  });
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 20,
});
