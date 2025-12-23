import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { handleAsyncRoute, AppError, VALIDATION_MISSING_FIELD } from '@/lib/errors/errorHandler';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { UserRepository } from '@/repositories/userRepository';
import { OnboardingService } from '@/services/creator/onboardingService';
import type { CategoryInput } from '@/types/creator';

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

    if (!body.categoryId) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'Category is required', 400);
    }

    if (!body.creatorGoal) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'Creator goal is required', 400);
    }

    const input: CategoryInput = {
      categoryId: body.categoryId,
      secondaryTags: body.secondaryTags,
      creatorGoal: body.creatorGoal,
    };

    const result = await onboardingService.submitCategory(userId, input);
    return successResponse(result, 'Category submitted', 201);
  });
}
