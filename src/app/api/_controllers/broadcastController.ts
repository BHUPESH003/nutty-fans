import { type BroadcastAudience } from '@prisma/client';

import { successResponse } from '@/lib/api/response';
import { handleAsyncRoute, VALIDATION_ERROR } from '@/lib/errors/errorHandler';
import { broadcastService } from '@/services/messaging/broadcast/broadcastService';

export const broadcastController = {
  async create(
    creatorId: string,
    body: {
      content?: string;
      ppvPrice?: number;
      audienceFilter?: string;
      scheduledAt?: string | null;
    }
  ) {
    return handleAsyncRoute(async () => {
      if (!body.content) throw new Error(VALIDATION_ERROR);

      const audienceFilter =
        typeof body.audienceFilter === 'string'
          ? (body.audienceFilter as BroadcastAudience)
          : undefined;

      const broadcast = await broadcastService.createBroadcast(creatorId, {
        content: body.content,
        ppvPrice: body.ppvPrice ?? null,
        audienceFilter,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      });

      return successResponse(broadcast);
    });
  },

  async list(creatorId: string, cursor?: string) {
    return handleAsyncRoute(async () => {
      const result = await broadcastService.listCreatorBroadcasts(creatorId, cursor);
      return successResponse(result);
    });
  },

  async send(creatorId: string, broadcastId: string) {
    return handleAsyncRoute(async () => {
      const broadcast = await broadcastService.sendBroadcast(broadcastId, creatorId);
      return successResponse(broadcast);
    });
  },

  async analytics(creatorId: string, broadcastId: string) {
    return handleAsyncRoute(async () => {
      const analytics = await broadcastService.getAnalytics(broadcastId, creatorId);
      return successResponse(analytics);
    });
  },
};
