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

import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/db/prisma';
import { generateVideoWatermark } from '@/lib/security/watermarking';
import { SubscriptionRepository } from '@/repositories/subscriptionRepository';
import { muxClient } from '@/services/integrations/mux/muxClient';

const subscriptionRepo = new SubscriptionRepository();

// Playback token expiration (2-5 minutes as per requirement)
const PLAYBACK_TOKEN_EXPIRATION_SECONDS = 300; // 5 minutes

// Allowed domains for playback (production domains)
const ALLOWED_DOMAINS = process.env['ALLOWED_VIDEO_DOMAINS']
  ? process.env['ALLOWED_VIDEO_DOMAINS'].split(',')
  : ['nuttyfans.com', 'www.nuttyfans.com'];

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

  try {
    // Find the media record
    const media = await prisma.media.findUnique({
      where: { id: videoId },
      include: {
        post: {
          include: {
            creator: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!media) {
      return NextResponse.json(
        { error: { message: 'Video not found', code: 'VIDEO_NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (media.mediaType !== 'video') {
      return NextResponse.json(
        { error: { message: 'Media is not a video', code: 'INVALID_MEDIA_TYPE' } },
        { status: 400 }
      );
    }

    if (media.processingStatus !== 'completed') {
      return NextResponse.json(
        {
          error: {
            message: 'Video is still processing',
            code: 'VIDEO_PROCESSING',
            status: media.processingStatus,
          },
        },
        { status: 202 } // Accepted but not ready
      );
    }

    // Get Mux playback ID from metadata
    const metadata = media.metadata as Record<string, unknown> | null;
    const muxPlaybackId = metadata?.['muxPlaybackId'] as string | undefined;

    if (!muxPlaybackId) {
      return NextResponse.json(
        { error: { message: 'Video playback ID not available', code: 'PLAYBACK_ID_MISSING' } },
        { status: 500 }
      );
    }

    // Check post access (if video is attached to a post)
    if (media.post) {
      const post = media.post;
      const hasAccess = await checkPostAccess(
        post.id,
        post.accessLevel,
        post.ppvPrice?.toNumber() ?? null,
        session.user.id,
        post.creator.user.id
      );

      if (!hasAccess) {
        // Return 403 - DO NOT return any playback information
        return NextResponse.json(
          {
            error: {
              message: 'Access denied. Subscription or purchase required.',
              code: 'ACCESS_DENIED',
            },
          },
          { status: 403 }
        );
      }
    }

    // Domain/app restriction check
    const origin = request.headers.get('origin') || request.headers.get('referer');
    if (origin) {
      const originHost = new URL(origin).hostname;
      const isAllowed = ALLOWED_DOMAINS.some(
        (domain) => originHost === domain || originHost.endsWith(`.${domain}`)
      );

      // In development, allow localhost
      if (
        process.env['NODE_ENV'] !== 'production' &&
        (originHost === 'localhost' || originHost.includes('127.0.0.1'))
      ) {
        // Allow in dev
      } else if (!isAllowed) {
        return NextResponse.json(
          {
            error: {
              message: 'Playback not allowed from this domain',
              code: 'DOMAIN_RESTRICTED',
            },
          },
          { status: 403 }
        );
      }
    }

    // Generate signed playback URLs (expires in 5 minutes)
    // Uses JWT tokens with Mux signing keys for secure, expiring playback URLs
    const playbackUrls = await muxClient.getSignedPlaybackUrls(
      muxPlaybackId,
      PLAYBACK_TOKEN_EXPIRATION_SECONDS
    );

    // Generate dynamic watermark text (user ID, username, timestamp)
    // Note: session.user.name is available from NextAuth, username might be in token
    const watermarkText = generateVideoWatermark(session.user.id, session.user.name || undefined);

    // Log playback access (for analytics/audit)
    // Note: UserActivity table exists but may be partitioned - create silently if fails
    try {
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          activityType: 'video_watch',
          entityType: 'media',
          entityId: videoId,
          metadata: {
            playbackId: muxPlaybackId,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      // Silently fail if UserActivity table is not available (may be partitioned)
      console.warn('Failed to log video playback activity:', error);
    }

    return NextResponse.json({
      playbackUrl: playbackUrls.streamUrl,
      thumbnailUrl: playbackUrls.thumbnailUrl,
      posterUrl: playbackUrls.posterUrl,
      watermarkText, // Include watermark text for overlay
      expiresIn: PLAYBACK_TOKEN_EXPIRATION_SECONDS,
      expiresAt: new Date(Date.now() + PLAYBACK_TOKEN_EXPIRATION_SECONDS * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Video playback error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to generate playback URL',
          code: 'PLAYBACK_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Check if user has access to post content
 */
async function checkPostAccess(
  postId: string,
  accessLevel: string,
  ppvPrice: number | null,
  userId: string,
  creatorId: string
): Promise<boolean> {
  // Free content - always accessible
  if (accessLevel === 'free') {
    return true;
  }

  // Subscriber-only content
  if (accessLevel === 'subscribers') {
    const subscription = await subscriptionRepo.findActive(userId, creatorId);
    return !!subscription;
  }

  // PPV content
  if (accessLevel === 'ppv' && ppvPrice) {
    const purchase = await prisma.ppvPurchase.findFirst({
      where: {
        userId,
        postId,
      },
    });
    return !!purchase;
  }

  return false;
}
