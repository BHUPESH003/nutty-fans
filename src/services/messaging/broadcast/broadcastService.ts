import type { BroadcastAudience, BroadcastStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/prisma';
import { broadcastQueue } from '@/lib/queues';

type CreateBroadcastInput = {
  audienceFilter?: BroadcastAudience;
  content: string;
  mediaUrls?: string[];
  ppvPrice?: number | null;
  ppvDescription?: string | null;
  scheduledAt?: Date | null;
  customTagId?: string | null;
};

export class BroadcastService {
  async createBroadcast(creatorId: string, input: CreateBroadcastInput) {
    const status: BroadcastStatus = input.scheduledAt ? 'SCHEDULED' : 'DRAFT';

    const created = await prisma.broadcast.create({
      data: {
        creatorId,
        status,
        audienceFilter: input.audienceFilter ?? 'ALL_SUBSCRIBERS',
        customTagId: input.customTagId ?? undefined,
        content: input.content,
        mediaUrls: input.mediaUrls ?? [],
        ppvPrice: input.ppvPrice ?? null,
        ppvDescription: input.ppvDescription ?? undefined,
        scheduledAt: input.scheduledAt ?? undefined,
      },
    });

    return created;
  }

  async listCreatorBroadcasts(creatorId: string, cursor?: string, limit = 20) {
    const broadcasts = await prisma.broadcast.findMany({
      where: { creatorId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    let nextCursor: string | undefined = undefined;
    if (broadcasts.length > limit) {
      const next = broadcasts.pop();
      nextCursor = next?.id;
    }

    return { items: broadcasts, nextCursor };
  }

  async sendBroadcast(broadcastId: string, creatorId: string) {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast) throw new Error('Broadcast not found');
    if (broadcast.creatorId !== creatorId) throw new Error('Unauthorized');
    if (broadcast.status === 'SENDING') return broadcast;

    const recipientIds = await this.resolveRecipients(broadcast);

    const updated = await prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'SENDING',
        recipientCount: recipientIds.length,
        sentAt: new Date(),
      },
    });

    await broadcastQueue.add(
      'send',
      {
        broadcastId,
      },
      {
        jobId: `broadcast:${broadcastId}`,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    return updated;
  }

  async getAnalytics(broadcastId: string, creatorId: string) {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id: broadcastId, creatorId },
      select: {
        id: true,
        status: true,
        content: true,
        ppvPrice: true,
        sentAt: true,
        deliveredCount: true,
        openedCount: true,
        purchasedCount: true,
        revenueTotal: true,
      },
    });

    if (!broadcast) throw new Error('Broadcast not found');

    return broadcast;
  }

  private async resolveRecipients(broadcast: Prisma.BroadcastGetPayload<{}>) {
    // Phase 4 baseline: subscription-derived audiences.
    // Future phases will implement tiering + tagging + spenders.
    const audience = broadcast.audienceFilter;

    if (audience === 'ALL_SUBSCRIBERS' || audience === 'ACTIVE_SUBSCRIBERS') {
      const subs = await prisma.subscription.findMany({
        where: { creatorId: broadcast.creatorId, status: 'active' },
        select: { userId: true },
      });
      return subs.map((s) => s.userId);
    }

    // Default: no recipients
    return [] as string[];
  }
}

export const broadcastService = new BroadcastService();
