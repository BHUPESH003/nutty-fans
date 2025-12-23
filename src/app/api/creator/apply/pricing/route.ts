import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { handleAsyncRoute, AppError, VALIDATION_MISSING_FIELD } from '@/lib/errors/errorHandler';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { UserRepository } from '@/repositories/userRepository';
import { OnboardingService } from '@/services/creator/onboardingService';
import type { PricingInput } from '@/types/creator';

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

    if (body.subscriptionPrice === undefined) {
      throw new AppError(VALIDATION_MISSING_FIELD, 'Subscription price is required', 400);
    }

    const input: PricingInput = {
      subscriptionPrice: body.subscriptionPrice,
      subscriptionPrice3m: body.subscriptionPrice3m,
      subscriptionPrice6m: body.subscriptionPrice6m,
      subscriptionPrice12m: body.subscriptionPrice12m,
      freeTrialDays: body.freeTrialDays,
    };

    const result = await onboardingService.submitPricing(userId, input);
    return successResponse(result, 'Pricing submitted', 201);
  });
}
