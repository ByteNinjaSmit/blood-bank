// Cache-aside helper over Redis. Use for hot read-mostly views
// (inventory stock summary, compatibility lookups). Always namespace
// keys by domain so invalidation is targeted.
//
//   const stock = await cached('inventory:summary', 30, () => repo.summary());
//   await invalidate('inventory:*');   // after a unit status change

import { getRedis } from '@/core/redis';
import { logger } from '@/core/logger';

const log = logger.child({ module: 'core/cache' });

// The shared ioredis client runs with `maxRetriesPerRequest: null` because
// Bull requires it. That setting also means a command issued while Redis is
// unreachable sits in the offline queue indefinitely — it never rejects, so
// a plain try/catch around an `await` does nothing. Every cache call is
// therefore bounded here: the cache is best-effort by definition, and a
// Redis outage must degrade reads to the loader rather than hang the
// request that triggered them.
const CACHE_OP_TIMEOUT_MS = 1000;

function bounded<T>(op: () => Promise<T>, what: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      log.warn({ op: what }, 'cache operation timed out — continuing without cache');
      resolve(undefined);
    }, CACHE_OP_TIMEOUT_MS);

    op().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        log.warn({ op: what, err: (err as Error).message }, 'cache operation failed');
        resolve(undefined);
      },
    );
  });
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();

  // undefined = unreachable or timed out, null = genuine miss. Both fall
  // through to the loader.
  const hit = await bounded(() => redis.get(key), `get ${key}`);
  if (hit != null) {
    try {
      return JSON.parse(hit) as T;
    } catch (err) {
      log.warn({ key, err: (err as Error).message }, 'cache entry unparseable, reloading');
    }
  }

  const value = await loader();
  await bounded(() => redis.set(key, JSON.stringify(value), 'EX', ttlSeconds), `set ${key}`);
  return value;
}

export async function invalidate(pattern: string): Promise<void> {
  const redis = getRedis();
  // SCAN avoids blocking Redis on large keyspaces (vs KEYS).
  let cursor = '0';
  do {
    const page = await bounded(
      () => redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100),
      `scan ${pattern}`,
    );
    // Redis is unreachable — abandon the sweep rather than spin. Entries
    // expire on their own TTL, so the worst case is briefly stale reads.
    if (!page) return;

    const [next, keys] = page;
    cursor = next;
    if (keys.length > 0) await bounded(() => redis.del(...keys), `del ${keys.length} keys`);
  } while (cursor !== '0');
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await bounded(() => getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds), `set ${key}`);
}
