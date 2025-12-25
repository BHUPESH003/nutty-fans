import { NextResponse } from 'next/server';

import { successResponse } from '@/lib/api/response';
import { PublicCreatorService } from '@/services/creator/publicCreatorService';

const publicCreatorService = new PublicCreatorService();

export const publicCreatorController = {
  async getPublicProfile(handle: string, viewerId?: string) {
    const profile = await publicCreatorService.getPublicProfile(handle, viewerId);
    if (!profile) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Creator not found' } },
        { status: 404 }
      );
    }
    return successResponse(profile);
  },

  async getPublicPostsByHandle(
    handle: string,
    viewerId?: string,
    params?: { cursor?: string; limit?: number }
  ) {
    const result = await publicCreatorService.getPublicPostsByHandle(handle, viewerId, params);
    if (!result) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Creator not found' } },
        { status: 404 }
      );
    }
    return successResponse(result.feed);
  },
};
