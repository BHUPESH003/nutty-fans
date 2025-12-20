import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { errorResponse, successResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { ProfileRepository } from '@/repositories/profileRepository';
import { ProfileService } from '@/services/profileService';

const profileService = new ProfileService(new ProfileRepository());

export class ProfileController {
  async me(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return errorResponse('Authentication required.', 401, { code: 'AUTH_REQUIRED' });
    }

    const profile = await profileService.getSelfProfile(userId);
    if (!profile) {
      return errorResponse('Profile not found.', 404, { code: 'PROFILE_NOT_FOUND' });
    }

    return successResponse(profile);
  }

  async byHandle(_req: NextRequest, handle: string): Promise<NextResponse> {
    const profile = await profileService.getPublicProfile(handle);
    if (!profile) {
      return errorResponse('Profile not found.', 404, { code: 'PROFILE_NOT_FOUND' });
    }

    return successResponse(profile);
  }

  async update(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return errorResponse('Authentication required.', 401, { code: 'AUTH_REQUIRED' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = ((await req.json()) as any) ?? {};
    try {
      const updated = await profileService.updateProfile(userId, {
        displayName: body.displayName,
        bio: body.bio ?? null,
        location: body.location ?? null,
        isDiscoverable: body.isDiscoverable,
        showLocation: body.showLocation,
      });
      return successResponse(updated);
    } catch (error) {
      if (error instanceof Error && 'details' in error) {
        const details = (error as Error & { details?: unknown }).details;
        return errorResponse('One or more fields are invalid.', 400, {
          code: 'VALIDATION_ERROR',
          details,
        });
      }
      return errorResponse('Unable to update profile.', 500, { code: 'UNKNOWN_ERROR' });
    }
  }
}

export const profileController = new ProfileController();
