import { Redis } from 'ioredis';

function getRedisUrl(): string {
  const url = process.env['REDIS_URL'];
  if (!url) {
    throw new Error('Missing required env var: REDIS_URL');
  }
  return url;
}

function parseRedisConnectionOptions() {
  const url = new URL(getRedisUrl());

  const port = url.port ? Number(url.port) : url.protocol === 'rediss:' ? 6380 : 6379;
  const password = url.password ? decodeURIComponent(url.password) : undefined;
  const tls = url.protocol === 'rediss:' ? {} : undefined;

  return {
    host: url.hostname,
    port,
    password,
    tls,
  };
}

export const redisConnection = parseRedisConnectionOptions();

declare global {
  var __nuttyfans_redis__:
    | undefined
    | {
        redis: Redis;
        redisPub: Redis;
        redisSub: Redis;
      };
}

function createRedisClients() {
  const url = getRedisUrl();

  const shared = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  };

  const redis = new Redis(url, shared);
  const redisPub = new Redis(url, shared);
  const redisSub = new Redis(url, shared);

  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
  });

  return { redis, redisPub, redisSub };
}

const g = globalThis as typeof globalThis & {
  __nuttyfans_redis__?: {
    redis: Redis;
    redisPub: Redis;
    redisSub: Redis;
  };
};

if (!g.__nuttyfans_redis__) {
  g.__nuttyfans_redis__ = createRedisClients();
}

export const redis = g.__nuttyfans_redis__!.redis;
export const redisPub = g.__nuttyfans_redis__!.redisPub;
export const redisSub = g.__nuttyfans_redis__!.redisSub;
