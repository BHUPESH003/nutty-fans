import { Worker } from 'bullmq';

import { prisma } from '@/lib/db/prisma';
import { broadcastQueue } from '@/lib/queues';
import { redisConnection } from '@/lib/redis/redisClient';
import { ConversationService } from '@/services/messaging/conversationService';
import { MessageService } from '@/services/messaging/messageService';

// Job payload handled by the BullMQ worker.
type BroadcastJob = {
  broadcastId: string;
};

const conversationService = new ConversationService();
const messageService = new MessageService();

function normalizeParticipants(a: string, b: string) {
  return a < b ? { participant1: a, participant2: b } : { participant1: b, participant2: a };
}

export function startBroadcastWorker() {
  const concurrency = parseInt(process.env['BROADCAST_WORKER_CONCURRENCY'] || '2', 10);

  const worker = new Worker(
    broadcastQueue.name,
    async (job) => {
      const data = job.data as BroadcastJob;
      const broadcast = await prisma.broadcast.findUnique({ where: { id: data.broadcastId } });
      if (!broadcast) return;

      // Resolve audience (Phase 4 baseline: subscription-derived).
      const subs = await prisma.subscription.findMany({
        where: { creatorId: broadcast.creatorId, status: 'active' },
        select: { userId: true },
      });
      const recipientIds = subs.map((s) => s.userId);

      for (const fanId of recipientIds) {
        const { participant1, participant2 } = normalizeParticipants(broadcast.creatorId, fanId);

        // Ensure conversation exists between creator and fan.
        const existingConv = await prisma.conversation.findFirst({
          where: {
            participant1,
            participant2,
          },
          select: { id: true },
        });

        const conversation =
          existingConv ?? (await conversationService.create(participant1, participant2));

        const conversationId = conversation?.id ?? existingConv?.id;
        if (!conversationId) continue;

        const clientId = `broadcast:${broadcast.id}:${fanId}`;

        // messageService already updates unread counters + emits realtime.
        await messageService.send(
          broadcast.creatorId,
          conversationId,
          broadcast.content,
          undefined,
          broadcast.ppvPrice ? Number(broadcast.ppvPrice) : undefined,
          clientId,
          { broadcastId: broadcast.id }
        );
      }

      await prisma.broadcast.update({
        where: { id: broadcast.id },
        data: {
          status: 'SENT',
          deliveredCount: recipientIds.length,
          sentAt: broadcast.sentAt ?? new Date(),
        },
      });
    },
    {
      connection: redisConnection,
      concurrency,
    }
  );

  worker.on('failed', (job, err) => {
    console.error('[BroadcastWorker] job failed', job?.id, err);
  });

  worker.on('completed', (job) => {
    console.warn('[BroadcastWorker] completed', job.id);
  });
}
