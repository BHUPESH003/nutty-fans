import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { handleAsyncRoute, AppError, VALIDATION_MISSING_FIELD } from '@/lib/errors/errorHandler';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { UserRepository } from '@/repositories/userRepository';
import { OnboardingService } from '@/services/creator/onboardingService';
import type { EligibilityInput } from '@/types/creator';

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

    // Validate required fields
    if (body.ageConfirmed !== true) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'You must confirm you are 18 or older', 400);
    }

    if (!body.country) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'Country is required', 400);
    }

    if (!body.contentTypeIntent) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'Content type intent is required', 400);
    }

    const input: EligibilityInput = {
      ageConfirmed: body.ageConfirmed,
      country: body.country,
      contentTypeIntent: body.contentTypeIntent,
    };

    const result = await onboardingService.submitEligibility(userId, input);
    return successResponse(result, 'Eligibility submitted', 201);
  });
}
