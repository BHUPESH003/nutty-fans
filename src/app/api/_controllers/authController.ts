import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { successResponse } from '@/lib/api/response';
import { AppError, handleAsyncRoute, VALIDATION_MISSING_FIELD } from '@/lib/errors/errorHandler';
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
    return handleAsyncRoute(async () => {
      const body = await req.json();

      const { email, password, displayName, username, dateOfBirth, country } = body ?? {};
      if (!email || !displayName) {
        throw new AppError(VALIDATION_MISSING_FIELD, 'Missing required fields', 400);
      }

      const user = await authService.register({
        email,
        password: password ?? null,
        displayName,
        username: username || email.split('@')[0],
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        country: country || undefined,
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

      return successResponse(
        { id: user.id, email: user.email },
        'User registered successfully',
        201
      );
    });
  }
}

export const authController = new AuthController();
