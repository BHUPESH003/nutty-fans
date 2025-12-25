import { LiveStreamRepository } from '@/repositories/liveStreamRepository';
import { SubscriptionRepository } from '@/repositories/subscriptionRepository';
import { TransactionRepository } from '@/repositories/transactionRepository';
import { CreatorAccessService } from '@/services/creator/creatorAccessService';
import { MuxClient } from '@/services/integrations/mux/muxClient';
import { paymentService } from '@/services/payments/paymentService';

export class LiveStreamService {
  constructor(
    private readonly liveRepo = new LiveStreamRepository(),
    private readonly creatorAccessService = new CreatorAccessService(),
    private readonly subscriptionRepo = new SubscriptionRepository(),
    private readonly transactionRepo = new TransactionRepository(),
    private readonly mux = new MuxClient()
  ) {}

  async create(userId: string, input: any) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    const creatorId = await this.creatorAccessService.requireCreatorIdByUserId(userId);
    const { title, description, thumbnailUrl, accessLevel, entryPrice, scheduledAt } = input ?? {};

    if (!title) throw new Error('Title is required');
    if (!accessLevel) throw new Error('Access level is required');
    if (accessLevel === 'paid' && (!entryPrice || Number(entryPrice) <= 0)) {
      throw new Error('Entry price is required for paid streams');
    }

    const muxStream = await this.mux.createLiveStream(`creatorId:${creatorId}`);

    const stream = await this.liveRepo.create({
      creatorId,
      title,
      description: description ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      accessLevel,
      entryPrice: accessLevel === 'paid' ? Number(entryPrice) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      streamKey: muxStream.streamKey,
      playbackId: muxStream.playbackId,
      muxLiveStreamId: muxStream.muxLiveStreamId,
    });

    return {
      stream: {
        id: stream.id,
        title: stream.title,
        status: stream.status,
        streamKey: stream.streamKey,
        rtmpUrl: muxStream.rtmpUrl,
      },
    };
  }

  async getById(streamId: string) {
    const stream = await this.liveRepo.findById(streamId);
    if (!stream) throw new Error('Stream not found');
    return stream;
  }

  async listLive(cursor?: string, limit = 20) {
    const streams = await this.liveRepo.listLive(cursor, limit);
    const hasMore = streams.length > limit;
    const items = hasMore ? streams.slice(0, limit) : streams;
    return {
      streams: items,
      nextCursor: hasMore && items.length > 0 ? items[items.length - 1]!.id : null,
      hasMore,
    };
  }

  async start(userId: string, streamId: string) {
    const creatorId = await this.creatorAccessService.requireCreatorIdByUserId(userId);
    const stream = await this.liveRepo.findById(streamId);
    if (!stream) throw new Error('Stream not found');
    if (stream.creatorId !== creatorId) throw new Error('Unauthorized');
    if (stream.status !== 'scheduled') throw new Error('Stream cannot be started');

    return this.liveRepo.update(streamId, { status: 'live', startedAt: new Date() });
  }

  async end(userId: string, streamId: string) {
    const creatorId = await this.creatorAccessService.requireCreatorIdByUserId(userId);
    const stream = await this.liveRepo.findById(streamId);
    if (!stream) throw new Error('Stream not found');
    if (stream.creatorId !== creatorId) throw new Error('Unauthorized');
    if (stream.status !== 'live') throw new Error('Stream is not live');

    if (stream.muxLiveStreamId) {
      await this.mux.completeLiveStream(stream.muxLiveStreamId);
    }

    return this.liveRepo.update(streamId, { status: 'ended', endedAt: new Date() });
  }

  async purchaseEntry(userId: string, streamId: string) {
    const stream = await this.liveRepo.findById(streamId);
    if (!stream) throw new Error('Stream not found');
    if (stream.accessLevel !== 'paid') throw new Error('Stream is not paid');
    const price = stream.entryPrice?.toNumber?.() ?? null;
    if (!price) throw new Error('Entry price not set');

    const alreadyPaid = await this.transactionRepo.hasCompletedRelatedTransaction(
      userId,
      'live_stream_entry',
      streamId
    );
    if (alreadyPaid) throw new Error('You already purchased access');

    // Record as "ppv" (TransactionType enum has no "live_entry")
    const debit = await paymentService.debitWallet(userId, {
      transactionType: 'ppv',
      amount: price,
      creatorId: stream.creatorId,
      relatedId: streamId,
      relatedType: 'live_stream_entry',
      description: `Live stream entry: ${stream.title}`,
    });

    return { transactionId: debit.transactionId };
  }

  async checkAccess(userId: string | undefined, streamId: string) {
    const stream = await this.liveRepo.findById(streamId);
    if (!stream) throw new Error('Stream not found');

    if (stream.accessLevel === 'free') return { stream, hasAccess: true };
    if (!userId) return { stream, hasAccess: false };

    // Creator always has access
    const creatorProfile = await this.creatorAccessService
      .requireCreatorIdByUserId(userId)
      .catch(() => null);
    if (creatorProfile && creatorProfile === stream.creatorId) {
      return { stream, hasAccess: true };
    }

    const isSubscribed = await this.subscriptionRepo.isSubscribed(userId, stream.creatorId);
    if (stream.accessLevel === 'subscribers') return { stream, hasAccess: isSubscribed };
    if (stream.accessLevel === 'paid') {
      if (isSubscribed) return { stream, hasAccess: true };
      const paid = await this.transactionRepo.hasCompletedRelatedTransaction(
        userId,
        'live_stream_entry',
        streamId
      );
      return { stream, hasAccess: paid };
    }

    return { stream, hasAccess: false };
  }

  async getPlaybackUrlsForViewer(userId: string | undefined, streamId: string) {
    const { stream, hasAccess } = await this.checkAccess(userId, streamId);
    if (!hasAccess) throw new Error('No access');
    if (!stream.playbackId) throw new Error('Playback not available');
    return this.mux.getSignedPlaybackUrls(stream.playbackId);
  }
}
