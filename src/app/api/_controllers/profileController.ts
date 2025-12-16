import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { ProfileRepository } from '@/repositories/profileRepository';
import { ProfileService } from '@/services/profileService';

const profileService = new ProfileService(new ProfileRepository());

export class ProfileController {
  async me(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const profile = await profileService.getSelfProfile(userId);
    if (!profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  }

  async byHandle(_req: NextRequest, handle: string): Promise<NextResponse> {
    const profile = await profileService.getPublicProfile(handle);
    if (!profile) {
      return NextResponse.json(
        { error: { code: 'PROFILE_NOT_FOUND', message: 'Profile not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  }

  async update(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
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
      return NextResponse.json(updated);
    } catch (error) {
      if (error instanceof Error && 'details' in error) {
        const details = (error as Error & { details?: unknown }).details;
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'One or more fields are invalid.',
              details,
            },
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: { code: 'UNKNOWN_ERROR', message: 'Unable to update profile.' } },
        { status: 500 }
      );
    }
  }
}

export const profileController = new ProfileController();
