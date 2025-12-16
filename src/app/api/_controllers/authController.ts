import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { UserRepository } from '@/repositories/userRepository';
import { VerificationTokenRepository } from '@/repositories/verificationTokenRepository';
import { AuthService } from '@/services/auth/authService';
import { EmailService } from '@/services/auth/emailService';
import { TokenService } from '@/services/auth/tokenService';

const authService = new AuthService(new UserRepository());
const tokenService = new TokenService(new VerificationTokenRepository());
const emailService = new EmailService();

export class AuthController {
  async register(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();

    const { email, password, displayName, username, dateOfBirth, country } = body ?? {};
    if (!email || !displayName || !username || !dateOfBirth || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const user = await authService.register({
        email,
        password: password ?? null,
        displayName,
        username,
        dateOfBirth: new Date(dateOfBirth),
        country,
      });

      // Issue verification token and send verification email
      const { token } = await tokenService.createToken({
        userId: user.id,
        type: 'email_verify',
        ttlMs: 24 * 60 * 60 * 1000, // 24 hours
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        userAgent: req.headers.get('user-agent'),
      });

      await emailService.sendVerificationEmail({ email: user.email, token });

      return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
    } catch (error) {
      if (error instanceof Error) {
        // Do not leak existence details beyond generic error for privacy;
        // specific mapping will be handled by frontend per API spec.
        return NextResponse.json({ error: 'Unable to register user' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
    }
  }
}

export const authController = new AuthController();
