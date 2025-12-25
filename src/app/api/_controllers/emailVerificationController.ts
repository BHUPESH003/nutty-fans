import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { successResponse, errorResponse } from '@/lib/api/response';
import { EmailVerificationService } from '@/services/auth/emailVerificationService';

const emailVerificationService = new EmailVerificationService();

export const emailVerificationController = {
  async verify(req: NextRequest): Promise<NextResponse> {
    try {
      const { token } = (await req.json()) ?? {};
      if (!token || typeof token !== 'string') {
        return errorResponse('Invalid or missing token', 400);
      }

      const result = await emailVerificationService.verifyEmail(token);
      return successResponse(result, 'Email verified successfully');
    } catch {
      // Generic message to avoid information leaks
      return errorResponse('Invalid or expired verification link', 400);
    }
  },
};
