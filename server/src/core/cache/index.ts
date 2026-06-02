// Cache-aside helper over Redis. Use for hot read-mostly views
// (inventory stock summary, compatibility lookups). Always namespace
// keys by domain so invalidation is targeted.
//
//   const stock = await cached('inventory:summary', 30, () => repo.summary());
//   await invalidate('inventory:*');   // after a unit status change

import { getRedis } from '@/core/redis';
import { logger } from '@/core/logger';

const log = logger.child({ module: 'core/cache' });

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  try {
    const hit = await redis.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch (err) {
    log.warn({ key, err: (err as Error).message }, 'cache read failed, falling through');
  }

  const value = await loader();

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    log.warn({ key, err: (err as Error).message }, 'cache write failed');
  }
  return value;
}

export async function invalidate(pattern: string): Promise<void> {
  const redis = getRedis();
  // SCAN avoids blocking Redis on large keyspaces (vs KEYS).
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = next;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== '0');
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
