import { NextResponse } from 'next/server';

import { successResponse } from '@/lib/api/response';
import { AppError, handleAsyncRoute, VALIDATION_MISSING_FIELD } from '@/lib/errors/errorHandler';
import { LiveStreamService } from '@/services/live/liveStreamService';

const liveStreamService = new LiveStreamService();

export const liveStreamController = {
  async create(userId: string, body: unknown) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      const result = await liveStreamService.create(userId, body);
      return successResponse(result, 'Stream created', 201);
    });
  },

  async get(streamId: string, viewerId?: string) {
    return handleAsyncRoute(async () => {
      if (!streamId) throw new AppError(VALIDATION_MISSING_FIELD, 'Stream ID is required', 400);
      const { stream, hasAccess } = await liveStreamService.checkAccess(viewerId, streamId);
      return successResponse({
        stream: {
          id: stream.id,
          title: stream.title,
          description: stream.description,
          thumbnailUrl: stream.thumbnailUrl,
          accessLevel: stream.accessLevel,
          entryPrice: stream.entryPrice?.toNumber?.() ?? null,
          status: stream.status,
          scheduledAt: stream.scheduledAt,
          startedAt: stream.startedAt,
          endedAt: stream.endedAt,
          creator: {
            id: stream.creatorId,
            handle: stream.creator.user.username,
            displayName: stream.creator.user.displayName ?? stream.creator.user.username,
            avatarUrl: stream.creator.user.avatarUrl,
          },
        },
        hasAccess,
      });
    });
  },

  async listLive(cursor?: string) {
    return handleAsyncRoute(async () => {
      const result = await liveStreamService.listLive(cursor);
      return successResponse(result);
    });
  },

  async start(userId: string, streamId: string) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      if (!streamId) throw new AppError(VALIDATION_MISSING_FIELD, 'Stream ID is required', 400);
      const result = await liveStreamService.start(userId, streamId);
      return successResponse(result, 'Stream started');
    });
  },

  async end(userId: string, streamId: string) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      if (!streamId) throw new AppError(VALIDATION_MISSING_FIELD, 'Stream ID is required', 400);
      const result = await liveStreamService.end(userId, streamId);
      return successResponse(result, 'Stream ended');
    });
  },

  async purchaseEntry(userId: string, streamId: string) {
    return handleAsyncRoute(async () => {
      if (!userId) throw new AppError(VALIDATION_MISSING_FIELD, 'User ID is required', 400);
      if (!streamId) throw new AppError(VALIDATION_MISSING_FIELD, 'Stream ID is required', 400);
      const result = await liveStreamService.purchaseEntry(userId, streamId);
      return successResponse(result, 'Access purchased', 201);
    });
  },

  async playback(streamId: string, viewerId?: string) {
    return handleAsyncRoute(async () => {
      if (!streamId) throw new AppError(VALIDATION_MISSING_FIELD, 'Stream ID is required', 400);
      const urls = await liveStreamService.getPlaybackUrlsForViewer(viewerId, streamId);
      return successResponse(urls);
    });
  },

  notFound(message: string) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message } }, { status: 404 });
  },
};
