import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { handleAsyncRoute } from '@/lib/errors/errorHandler';
import { CreatorRepository } from '@/repositories/creatorRepository';
import { UserRepository } from '@/repositories/userRepository';
import { OnboardingService } from '@/services/creator/onboardingService';

const creatorRepo = new CreatorRepository();
const userRepo = new UserRepository();
const onboardingService = new OnboardingService(creatorRepo, userRepo);

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      { error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  return handleAsyncRoute(async () => {
    const result = await onboardingService.submitForReview(userId);
    return successResponse(result, 'Submitted for review', 201);
  });
}
