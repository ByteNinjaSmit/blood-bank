import { getQueue } from '@/core/queue';
import { childLogger } from '@/core/logger';
import { createTtiRepo } from '@/modules/tti/tti.repository';
import { notificationCenterService } from '@/modules/notification/notification-center.service';

const log = childLogger({ module: 'tti-jobs' });
const QUEUE = 'tti-maintenance';
const JOB_PENDING_SCAN = 'testing-backlog-scan';

const SCAN_INTERVAL_MS = 45 * 60 * 1000;

const ttiRepo = createTtiRepo();

export async function runTtiPendingScan(): Promise<number> {
  const count = await ttiRepo.countPendingTesting();
  if (count === 0) return 0;

  const bucket = Math.floor(Date.now() / SCAN_INTERVAL_MS);
  await notificationCenterService
    .notify({
      title: 'TTI testing pending',
      message: `${count} donation(s) awaiting TTI testing`,
      module: 'TTI_TESTING',
      category: 'TTI_TESTING_PENDING',
      severity: 'WARNING',
      relatedRecordType: 'TtiTestingBacklog',
      actionLink: '/serology',
      dedupeKey: `TTI_TESTING_PENDING_SCAN:${bucket}`,
    })
    .catch(() => undefined);

  log.info({ count }, 'TTI testing backlog scan complete');
  return count;
}

export function registerTtiJobs(): void {
  const queue = getQueue(QUEUE);

  queue.process(JOB_PENDING_SCAN, async () => runTtiPendingScan());

  void queue.add(
    JOB_PENDING_SCAN,
    {},
    {
      repeat: { every: SCAN_INTERVAL_MS }, // every 45 minutes
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: JOB_PENDING_SCAN,
    },
  );

  log.info('TTI testing backlog scan scheduled (every 45 minutes)');
}
