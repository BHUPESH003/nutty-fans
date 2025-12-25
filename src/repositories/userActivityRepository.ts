import { prisma } from '@/lib/db/prisma';

export class UserActivityRepository {
  async logVideoWatch(userId: string, mediaId: string, muxPlaybackId: string) {
    return prisma.userActivity.create({
      data: {
        userId,
        activityType: 'video_watch',
        entityType: 'media',
        entityId: mediaId,
        metadata: {
          playbackId: muxPlaybackId,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }
}
