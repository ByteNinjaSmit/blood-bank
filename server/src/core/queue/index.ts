import Queue, { type Queue as BullQueue } from 'bull';
import { newRedisConnection } from '@/core/redis';
import { logger } from '@/core/logger';

const log = logger.child({ module: 'core/queue' });

const registry = new Map<string, BullQueue>();
const dlqRegistry = new Map<string, BullQueue>();

export const QUEUE_NAMES = {
  EMAIL: 'email',
  INVENTORY_MAINTENANCE: 'inventory-maintenance',
  INVENTORY_REPORTS: 'inventory-reports',
  DONOR_MAINTENANCE: 'donor-maintenance',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Per-queue tuning: override defaults for specific queues.
const QUEUE_CONFIG: Partial<
  Record<string, { attempts: number; concurrency?: number; delay?: number }>
> = {
  [QUEUE_NAMES.EMAIL]: { attempts: 5, delay: 2_000 },
  [QUEUE_NAMES.INVENTORY_MAINTENANCE]: { attempts: 3, delay: 60_000 },
  [QUEUE_NAMES.INVENTORY_REPORTS]: { attempts: 3, delay: 30_000 },
  [QUEUE_NAMES.DONOR_MAINTENANCE]: { attempts: 2, delay: 10_000 },
};

export function getQueue<T = unknown>(name: string): BullQueue<T> {
  const existing = registry.get(name);
  if (existing) return existing as BullQueue<T>;

  const cfg: { attempts?: number; delay?: number } = QUEUE_CONFIG[name] ?? {};

  // Bull requires separate Redis connections for the subscriber and bclient
  // (blocking commands). Using newRedisConnection() for each avoids sharing
  // the main ioredis client across blocking+non-blocking commands.
  const queue = new Queue<T>(name, {
    createClient(type) {
      switch (type) {
        case 'client':
          return newRedisConnection();
        case 'subscriber':
          return newRedisConnection();
        case 'bclient':
          return newRedisConnection();
        default:
          return newRedisConnection();
      }
    },
    defaultJobOptions: {
      attempts: cfg.attempts ?? 3,
      backoff: {
        type: 'exponential',
        delay: cfg.delay ?? 5_000,
      },
      removeOnComplete: { count: 500, age: 86_400 }, // keep last 500 or 24h
      removeOnFail: { count: 2_000, age: 7 * 86_400 }, // keep failed 7 days
    },
  });

  // ── Event handlers ────────────────────────────────────────────────────────
  queue.on('error', (err) => log.error({ queue: name, err: err.message }, 'queue error'));
  queue.on('failed', (job, err) => {
    log.error(
      {
        queue: name,
        jobId: job.id,
        jobName: job.name,
        attempt: job.attemptsMade,
        err: err.message,
      },
      'job failed',
    );
    // Route to DLQ after all retries exhausted.
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      getDlq(name)
        .add(job.name, {
          originalJob: job.data,
          error: err.message,
          failedAt: new Date().toISOString(),
        })
        .catch((e: Error) => log.error({ queue: name, err: e.message }, 'dlq enqueue failed'));
    }
  });
  queue.on('stalled', (job) =>
    log.warn({ queue: name, jobId: job.id }, 'job stalled — will be reprocessed'),
  );
  queue.on('completed', (job) =>
    log.debug({ queue: name, jobId: job.id, jobName: job.name }, 'job completed'),
  );

  registry.set(name, queue);
  return queue;
}

function getDlq(sourceName: string): BullQueue {
  const dlqName = `${sourceName}:dlq`;
  const existing = dlqRegistry.get(dlqName);
  if (existing) return existing;
  const dlq = new Queue(dlqName, {
    createClient() {
      return newRedisConnection();
    },
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: { count: 10_000, age: 30 * 86_400 },
      removeOnFail: false,
    },
  });
  dlq.on('error', (err) => log.error({ queue: dlqName, err: err.message }, 'dlq error'));
  dlqRegistry.set(dlqName, dlq);
  return dlq;
}

// ── Health / metrics ──────────────────────────────────────────────────────────

export interface QueueHealth {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  dlqWaiting: number;
}

export async function getQueuesHealth(): Promise<QueueHealth[]> {
  const results: QueueHealth[] = [];
  for (const [name, queue] of registry.entries()) {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    const dlq = dlqRegistry.get(`${name}:dlq`);
    const dlqWaiting = dlq ? await dlq.getWaitingCount() : 0;
    results.push({ name, waiting, active, completed, failed, delayed, dlqWaiting });
  }
  return results;
}

export async function retryDlq(queueName: string, limit = 50): Promise<number> {
  const dlq = dlqRegistry.get(`${queueName}:dlq`);
  if (!dlq) return 0;
  const jobs = await dlq.getWaiting(0, limit - 1);
  let retried = 0;
  for (const job of jobs) {
    const original = (job.data as { originalJob?: unknown }).originalJob;
    if (original) {
      await getQueue(queueName).add(job.name, original, { attempts: 1 });
      await job.remove();
      retried++;
    }
  }
  return retried;
}
