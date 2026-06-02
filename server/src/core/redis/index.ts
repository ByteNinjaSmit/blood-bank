// Shared ioredis client. One connection reused for cache + as the
// backend for Bull queues + pub/sub. Lazy-connect so importing this
// module doesn't force a connection in unit tests.

import Redis, { type Redis as RedisClient } from 'ioredis';
import { env } from '@/core/config/env';
import { logger } from '@/core/logger';

const log = logger.child({ module: 'core/redis' });

let client: RedisClient | null = null;

export function getRedis(): RedisClient {
  if (client) return client;
  client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by Bull
    enableReadyCheck: true,
    lazyConnect: false,
  });
  client.on('error', (err) => log.error({ err: err.message }, 'redis error'));
  client.on('connect', () => log.info('redis connected'));
  return client;
}

export function newRedisConnection(): RedisClient {
  // Bull needs separate connections for blocking commands.
  return new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
