import { getQueue } from '@/core/queue';
import { childLogger } from '@/core/logger';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createComponentRepo } from '@/modules/component/component.repository';
import { notificationCenterService } from '@/modules/notification/notification-center.service';

const log = childLogger({ module: 'component-jobs' });
const QUEUE = 'component-maintenance';
const JOB_SEPARATION_SCAN = 'separation-backlog-scan';

const SCAN_INTERVAL_MS = 60 * 60 * 1000;
// Components must be separated within 6h of collection — same constant as
// client/src/features/component/components/separate/CountdownCell.jsx.
const HOLDING_WINDOW_MS = 6 * 60 * 60 * 1000;
const CRITICAL_THRESHOLD_MS = 60 * 60 * 1000;

const componentRepo = createComponentRepo({ units: createUnitRepo() });

function bloodGroupLabel(bloodGroup: string, rh: string): string {
  return `${bloodGroup}${rh === 'Positive' ? '+' : '-'}`;
}

export async function runSeparationBacklogScan(): Promise<{ backlog: number; critical: number }> {
  const bags = (await componentRepo.listBagsToSeparate()) as Array<{
    donationId: string;
    donationType: string;
    bagNo: string;
    collectionDate: string;
    bloodGroup: string;
    rh: string;
  }>;

  const now = Date.now();

  // ─── Backlog digest — recurs every 1h cycle while backlog > 0 ────────────
  if (bags.length > 0) {
    const byGroup = new Map<string, number>();
    for (const bag of bags) {
      const label = bloodGroupLabel(bag.bloodGroup, bag.rh);
      byGroup.set(label, (byGroup.get(label) ?? 0) + 1);
    }
    const message = [...byGroup.entries()]
      .map(([label, count]) => `${label}: ${count} remaining`)
      .join(', ')
      .concat(' to separate');

    const bucket = Math.floor(now / SCAN_INTERVAL_MS);
    await notificationCenterService
      .notify({
        title: 'Component separation pending',
        message,
        module: 'COMPONENT_SEPARATION',
        category: 'COMPONENT_SEPARATION_PENDING',
        severity: 'WARNING',
        relatedRecordType: 'ComponentSeparationBacklog',
        actionLink: '/component-separation',
        dedupeKey: `COMPONENT_SEPARATION_PENDING_SCAN:${bucket}`,
      })
      .catch(() => undefined);
  }

  // ─── Holding-time-critical alert — fires once per bag ────────────────────
  let critical = 0;
  for (const bag of bags) {
    const deadline = new Date(bag.collectionDate).getTime() + HOLDING_WINDOW_MS;
    const remainingMs = deadline - now;
    if (remainingMs > 0 && remainingMs <= CRITICAL_THRESHOLD_MS) {
      critical++;
      await notificationCenterService
        .notify({
          title: 'Holding time critical',
          message: `Bag ${bag.bagNo} — holding time expires within 1 hour, separate now`,
          module: 'COMPONENT_SEPARATION',
          category: 'COMPONENT_SEPARATION_OVERDUE',
          severity: 'CRITICAL',
          relatedRecordId: bag.donationId,
          relatedRecordType: 'Donation',
          actionLink: '/component-separation',
          dedupeKey: `COMPONENT_SEPARATION_OVERDUE:${bag.donationId}`,
        })
        .catch(() => undefined);
    }
  }

  log.info({ backlog: bags.length, critical }, 'component separation backlog scan complete');
  return { backlog: bags.length, critical };
}

export function registerComponentJobs(): void {
  const queue = getQueue(QUEUE);

  queue.process(JOB_SEPARATION_SCAN, async () => runSeparationBacklogScan());

  void queue.add(
    JOB_SEPARATION_SCAN,
    {},
    {
      repeat: { cron: '0 * * * *' }, // every hour, on the hour
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: JOB_SEPARATION_SCAN,
    },
  );

  log.info('component separation backlog scan scheduled (hourly)');
}
