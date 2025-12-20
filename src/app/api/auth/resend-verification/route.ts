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
    return NextResponse.json(
      { message: 'If an account exists, a verification email was sent.' },
      { status: 200 }
    );
  }

  const userRepo = new UserRepository();
  const user = await userRepo.findByEmail(email.toLowerCase());
  if (user && !user.emailVerified) {
    const tokenService = new TokenService(new VerificationTokenRepository());
    const emailService = new EmailService();

    const { token } = await tokenService.createToken({
      userId: user.id,
      type: 'email_verify',
      ttlMs: 24 * 60 * 60 * 1000,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: req.headers.get('user-agent'),
    });

    await emailService.sendVerificationEmail({ email: user.email, token });
  }

  return NextResponse.json(
    { message: 'If an account exists, a verification email was sent.' },
    { status: 200 }
  );
}

export const POST = withRateLimit(handler, {
  windowMs: 15 * 60 * 1000,
  max: 20,
});
