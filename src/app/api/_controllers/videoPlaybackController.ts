import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { VideoPlaybackService } from '@/services/content/videoPlaybackService';

const PLAYBACK_TOKEN_EXPIRATION_SECONDS = 300; // 5 minutes
const ALLOWED_DOMAINS = process.env['ALLOWED_VIDEO_DOMAINS']
  ? process.env['ALLOWED_VIDEO_DOMAINS'].split(',')
  : ['nuttyfans.com', 'www.nuttyfans.com'];

const videoPlaybackService = new VideoPlaybackService();

export const videoPlaybackController = {
  async get(
    request: NextRequest,
    params: { mediaId: string; viewerUserId: string; viewerName?: string | null }
  ) {
    // Domain/app restriction check
    const origin = request.headers.get('origin') || request.headers.get('referer');
    if (origin) {
      const originHost = new URL(origin).hostname;
      const isAllowed = ALLOWED_DOMAINS.some(
        (domain) => originHost === domain || originHost.endsWith(`.${domain}`)
      );

      if (
        process.env['NODE_ENV'] !== 'production' &&
        (originHost === 'localhost' || originHost.includes('127.0.0.1'))
      ) {
        // allow in dev
      } else if (!isAllowed) {
        return NextResponse.json(
          {
            error: { message: 'Playback not allowed from this domain', code: 'DOMAIN_RESTRICTED' },
          },
          { status: 403 }
        );
      }
    }

    try {
      const result = await videoPlaybackService.getSecurePlayback({
        mediaId: params.mediaId,
        viewerUserId: params.viewerUserId,
        viewerName: params.viewerName,
        expirationSeconds: PLAYBACK_TOKEN_EXPIRATION_SECONDS,
      });

      return NextResponse.json({
        playbackUrl: result.playbackUrls.streamUrl,
        thumbnailUrl: result.playbackUrls.thumbnailUrl,
        posterUrl: result.playbackUrls.posterUrl,
        watermarkText: result.watermarkText,
        expiresIn: PLAYBACK_TOKEN_EXPIRATION_SECONDS,
        expiresAt: new Date(Date.now() + PLAYBACK_TOKEN_EXPIRATION_SECONDS * 1000).toISOString(),
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'PLAYBACK_ERROR';

      if (code === 'VIDEO_NOT_FOUND') {
        return NextResponse.json(
          { error: { message: 'Video not found', code: 'VIDEO_NOT_FOUND' } },
          { status: 404 }
        );
      }
      if (code === 'INVALID_MEDIA_TYPE') {
        return NextResponse.json(
          { error: { message: 'Media is not a video', code: 'INVALID_MEDIA_TYPE' } },
          { status: 400 }
        );
      }
      if (code === 'VIDEO_PROCESSING') {
        return NextResponse.json(
          { error: { message: 'Video is still processing', code: 'VIDEO_PROCESSING' } },
          { status: 202 }
        );
      }
      if (code === 'PLAYBACK_ID_MISSING') {
        return NextResponse.json(
          { error: { message: 'Video playback ID not available', code: 'PLAYBACK_ID_MISSING' } },
          { status: 500 }
        );
      }
      if (code === 'ACCESS_DENIED') {
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

      console.error('Video playback error:', err);
      return NextResponse.json(
        { error: { message: 'Failed to generate playback URL', code: 'PLAYBACK_ERROR' } },
        { status: 500 }
      );
    }
  },
};
