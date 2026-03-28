import { Queue } from 'bullmq';

import { redisConnection } from '@/lib/redis/redisClient';

export const broadcastQueue = new Queue('broadcasts', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const welcomeMessageQueue = new Queue('welcome-messages', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 2000 },
  },
});
