import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { handleAsyncRoute, AppError, VALIDATION_MISSING_FIELD } from '@/lib/errors/errorHandler';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { UserRepository } from '@/repositories/userRepository';
import { OnboardingService } from '@/services/creator/onboardingService';
import type { ProfileSetupInput } from '@/types/creator';

const creatorRepo = new CreatorRepository();
const userRepo = new UserRepository();
const onboardingService = new OnboardingService(creatorRepo, userRepo);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  return handleAsyncRoute(async () => {
    const body = await req.json();

    if (!body.displayName) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'Display name is required', 400);
    }

    if (!body.username) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'Username is required', 400);
    }

    if (!body.bio) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'Bio is required', 400);
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(body.username)) {
      throw new AppError(
        VALIDATION_MISSING_FIELD,
        'Username must be 3-30 characters, alphanumeric and underscores only',
        400
      );
    }

    const input: ProfileSetupInput = {
      displayName: body.displayName,
      username: body.username,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      socialLinks: body.socialLinks,
    };

    const result = await onboardingService.submitProfile(userId, input);
    return successResponse(result, 'Profile submitted', 201);
  });
}
