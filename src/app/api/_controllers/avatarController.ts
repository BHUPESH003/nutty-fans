import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { ProfileRepository } from '@/repositories/profileRepository';
import { AvatarService } from '@/services/avatarService';

const avatarService = new AvatarService(new ProfileRepository());

export class AvatarController {
  async uploadUrl(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = (await req.json()) ?? {};
    const { fileName, fileSize, mimeType } = body;

    try {
      const result = await avatarService.getUploadUrl(userId, {
        fileName,
        fileSize,
        mimeType,
      });
      return NextResponse.json(result);
    } catch (error) {
      if (error instanceof Error && 'details' in error) {
        const details = (error as Error & { details?: unknown }).details;
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_AVATAR_FILE',
              message: 'Avatar file is invalid.',
              details,
            },
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: { code: 'UNKNOWN_ERROR', message: 'Unable to generate upload URL.' } },
        { status: 500 }
      );
    }
  }

  async confirm(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const body = (await req.json()) ?? {};
    const { assetKey } = body;
    if (!assetKey || typeof assetKey !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_AVATAR_ASSET',
            message: 'Avatar asset is invalid or not found.',
          },
        },
        { status: 400 }
      );
    }

    const result = await avatarService.confirmAvatar(userId, assetKey);
    return NextResponse.json(result);
  }

  async remove(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    await avatarService.removeAvatar(userId);
    return NextResponse.json({ success: true });
  }
}

export const avatarController = new AvatarController();
