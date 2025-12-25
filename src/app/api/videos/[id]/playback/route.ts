/**
 * Secure Video Playback API
 *
 * MANDATORY REQUIREMENT: All video playback must go through this endpoint.
 *
 * Security Features:
 * - User authentication required
 * - Subscription/entitlement validation
 * - Short-lived signed playback tokens (2-5 minutes)
 * - Domain/app restrictions
 * - No hardcoded URLs in frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { videoPlaybackController } from '@/app/api/_controllers/videoPlaybackController';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: videoId } = await params;
  const session = await getServerSession(authOptions);

  // Authentication required
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { message: 'Authentication required', code: 'AUTH_REQUIRED' } },
      { status: 401 }
    );
  }
  return videoPlaybackController.get(request, {
    mediaId: videoId,
    viewerUserId: session.user.id,
    viewerName: session.user.name,
  });
}
