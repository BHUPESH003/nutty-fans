import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';

export class LiveStreamRepository {
  async create(data: {
    creatorId: string;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    accessLevel: 'free' | 'subscribers' | 'paid';
    entryPrice?: number | null;
    scheduledAt?: Date | null;
    streamKey: string;
    playbackId: string;
    muxLiveStreamId: string;
  }) {
    return prisma.liveStream.create({
      data: {
        creatorId: data.creatorId,
        title: data.title,
        description: data.description ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        accessLevel: data.accessLevel,
        entryPrice: data.entryPrice ?? null,
        status: 'scheduled',
        streamKey: data.streamKey,
        playbackId: data.playbackId,
        muxLiveStreamId: data.muxLiveStreamId,
        scheduledAt: data.scheduledAt ?? null,
      },
      include: {
        creator: {
          include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.liveStream.findUnique({
      where: { id },
      include: {
        creator: {
          include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
  }

  async listLive(cursor?: string, limit = 20) {
    return prisma.liveStream.findMany({
      where: { status: 'live' },
      orderBy: [{ startedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: {
        creator: {
          include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
  }

  async update(id: string, data: Prisma.LiveStreamUpdateInput) {
    return prisma.liveStream.update({
      where: { id },
      data,
      include: {
        creator: {
          include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
  }
}
