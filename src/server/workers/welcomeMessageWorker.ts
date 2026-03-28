import { Worker } from 'bullmq';

import { prisma } from '@/lib/db/prisma';
import { welcomeMessageQueue } from '@/lib/queues';
import { redisConnection } from '@/lib/redis/redisClient';
import { ConversationService } from '@/services/messaging/conversationService';
import { MessageService } from '@/services/messaging/messageService';

type WelcomeJob = {
  subscriptionId: string;
  creatorId: string;
  fanId: string;
};

const conversationService = new ConversationService();
const messageService = new MessageService();

function normalizeParticipants(a: string, b: string) {
  return a < b ? { participant1: a, participant2: b } : { participant1: b, participant2: a };
}

export function startWelcomeMessageWorker() {
  const concurrency = parseInt(process.env['BROADCAST_WORKER_CONCURRENCY'] || '2', 10);

  const worker = new Worker(
    welcomeMessageQueue.name,
    async (job) => {
      const data = job.data as WelcomeJob;

      const template = await prisma.welcomeMessageTemplate.findUnique({
        where: { creatorId: data.creatorId },
      });

      if (!template || !template.isEnabled) return;

      const { participant1, participant2 } = normalizeParticipants(data.creatorId, data.fanId);

      const conversation =
        (await prisma.conversation.findFirst({
          where: { participant1, participant2 },
          select: { id: true },
        })) ?? (await conversationService.create(participant1, participant2));

      const conversationId = (conversation as { id: string }).id;

      const clientId = `welcome:${data.subscriptionId}`;

      await messageService.send(
        data.creatorId,
        conversationId,
        template.content,
        undefined,
        template.ppvPrice ? Number(template.ppvPrice) : undefined,
        clientId,
        { welcomeTemplateId: template.id }
      );

      await prisma.welcomeMessageTemplate.update({
        where: { id: template.id },
        data: { sentCount: { increment: 1 } },
      });

      // CRM baseline: assign any automatic fan tags to this new fan.
      const autoTags = await prisma.fanTag.findMany({
        where: { creatorId: data.creatorId, isAutomatic: true },
      });

      for (const tag of autoTags) {
        await prisma.fanTagAssignment.upsert({
          where: { tagId_fanId: { tagId: tag.id, fanId: data.fanId } },
          update: {},
          create: { tagId: tag.id, fanId: data.fanId },
        });
      }
    },
    {
      connection: redisConnection,
      concurrency,
    }
  );

  worker.on('failed', (job, err) => {
    console.error('[WelcomeMessageWorker] failed', job?.id, err);
  });
}
