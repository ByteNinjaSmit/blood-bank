// Bull queue factory. One queue per concern. Jobs are idempotent and
// retried with exponential backoff. The email queue is created here;
// add expiry / discard / birthday queues the same way as they migrate.

import Queue, { type Queue as BullQueue } from 'bull';
import { env } from '@/core/config/env';
import { logger } from '@/core/logger';

const log = logger.child({ module: 'core/queue' });

const registry = new Map<string, BullQueue>();

export function getQueue<T = unknown>(name: string): BullQueue<T> {
  const existing = registry.get(name);
  if (existing) return existing as BullQueue<T>;

  const queue = new Queue<T>(name, env.REDIS_URL, {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 1_000, // keep last 1k for inspection
      removeOnFail: 5_000,
    },
  });

  queue.on('failed', (job, err) =>
    log.error({ queue: name, jobId: job.id, err: err.message }, 'job failed'),
  );
  queue.on('error', (err) => log.error({ queue: name, err: err.message }, 'queue error'));

  registry.set(name, queue);
  return queue;
}

export const QUEUE_NAMES = {
  EMAIL: 'email',
  EXPIRY: 'expiry',
  DISCARD: 'discard',
} as const;
