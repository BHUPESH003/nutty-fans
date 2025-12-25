import { generateVideoWatermark } from '@/lib/security/watermarking';
import { MediaRepository } from '@/repositories/mediaRepository';
import { UserActivityRepository } from '@/repositories/userActivityRepository';
import { PostService } from '@/services/content/postService';
import { muxClient } from '@/services/integrations/mux/muxClient';
import type { MuxPlaybackUrls } from '@/services/integrations/mux/types';

export class VideoPlaybackService {
  constructor(
    private readonly mediaRepo = new MediaRepository(),
    private readonly postService = new PostService(),
    private readonly userActivityRepo = new UserActivityRepository()
  ) {}

  async getSecurePlayback(params: {
    mediaId: string;
    viewerUserId: string;
    viewerName?: string | null;
    expirationSeconds: number;
  }): Promise<{
    playbackUrls: MuxPlaybackUrls;
    watermarkText: string;
    muxPlaybackId: string;
  }> {
    const media = await this.mediaRepo.findVideoForPlayback(params.mediaId);

    if (!media) throw new Error('VIDEO_NOT_FOUND');
    if (media.mediaType !== 'video') throw new Error('INVALID_MEDIA_TYPE');
    if (media.processingStatus !== 'completed') throw new Error('VIDEO_PROCESSING');

    const metadata = (media.metadata ?? {}) as Record<string, unknown>;
    const muxPlaybackId = metadata['muxPlaybackId'] as string | undefined;
    if (!muxPlaybackId) throw new Error('PLAYBACK_ID_MISSING');

    if (media.post) {
      const access = await this.postService.checkAccess(media.post.id, params.viewerUserId);
      if (!access.hasAccess) throw new Error('ACCESS_DENIED');
    }

    const playbackUrls = await muxClient.getSignedPlaybackUrls(
      muxPlaybackId,
      params.expirationSeconds
    );
    const watermarkText = generateVideoWatermark(
      params.viewerUserId,
      params.viewerName || undefined
    );

    // Best-effort analytics/audit
    try {
      await this.userActivityRepo.logVideoWatch(params.viewerUserId, params.mediaId, muxPlaybackId);
    } catch (err) {
      console.warn('Failed to log video playback activity:', err);
    }

    return { playbackUrls, watermarkText, muxPlaybackId };
  }
}
