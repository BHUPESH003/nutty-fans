import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

import { successResponse, errorResponse } from '@/lib/api/response';
import { authOptions } from '@/lib/auth/authOptions';
import { ProfileRepository } from '@/repositories/profileRepository';
import { AvatarService } from '@/services/avatarService';

const avatarService = new AvatarService(new ProfileRepository());

export class AvatarController {
  async uploadUrl(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return errorResponse('Authentication required.', 401, { code: 'AUTH_REQUIRED' });
    }

    const body = (await req.json()) ?? {};
    // Map frontend fields (filename, contentType) to service fields (fileName, mimeType)
    // Also support service fields directly for backward compatibility or other clients
    const fileName = body.filename || body.fileName;
    const mimeType = body.contentType || body.mimeType;
    const { fileSize } = body;

    try {
      const result = await avatarService.getUploadUrl(userId, {
        fileName,
        fileSize,
        mimeType,
      });

      // Map service response (assetKey) to frontend expectation (avatarKey)
      return successResponse({
        uploadUrl: result.uploadUrl,
        avatarKey: result.assetKey,
      });
    } catch (error) {
      if (error instanceof Error && 'details' in error) {
        const details = (error as Error & { details?: unknown }).details;
        return errorResponse('Avatar file is invalid.', 400, {
          code: 'INVALID_AVATAR_FILE',
          details,
        });
      }
      return errorResponse('Unable to generate upload URL.', 500, { code: 'UNKNOWN_ERROR' });
    }
  }

  async confirm(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return errorResponse('Authentication required.', 401, { code: 'AUTH_REQUIRED' });
    }

    const body = (await req.json()) ?? {};
    // Map frontend field (avatarKey) to service field (assetKey)
    const assetKey = body.avatarKey || body.assetKey;

    if (!assetKey || typeof assetKey !== 'string') {
      return errorResponse('Avatar asset is invalid or not found.', 400, {
        code: 'INVALID_AVATAR_ASSET',
      });
    }

    const result = await avatarService.confirmAvatar(userId, assetKey);
    return successResponse(result);
  }

  async remove() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string | undefined;
    if (!userId) {
      return errorResponse('Authentication required.', 401, { code: 'AUTH_REQUIRED' });
    }

    await avatarService.removeAvatar(userId);
    return successResponse({ success: true });
  }
}

export const avatarController = new AvatarController();
