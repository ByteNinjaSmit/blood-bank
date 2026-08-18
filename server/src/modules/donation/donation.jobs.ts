// Recurring nag for incomplete Inward Donations. Runs every 45 minutes
// (genuinely recurring via a Bull repeatable job — not "opportunistic on
// page load" like notification-center.service.ts's checkAndCreateStockSummary,
// which this otherwise mirrors: broadcast (userId: null), time-bucketed
// dedupeKey so concurrent workers/retries never double-fire).

import { getQueue, QUEUE_NAMES } from '@/core/queue';
import { childLogger } from '@/core/logger';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { notificationCenterService } from '@/modules/notification/notification-center.service';

const log = childLogger({ module: 'donation-jobs' });
const JOB_INWARD_NAG = 'inward-donation-incomplete-nag';
const INWARD_NAG_INTERVAL_MS = 45 * 60 * 1000;

const donations = createDonationRepo();

export async function runInwardDonationNag(): Promise<number> {
  // pageSize:1 — only the total count is needed for the summary message.
  const { total } = await donations.listIncomplete({ page: 1, pageSize: 1 });
  if (total === 0) return 0;

  const bucket = Math.floor(Date.now() / INWARD_NAG_INTERVAL_MS);
  const created = await notificationCenterService.notify({
    userId: null,
    title: 'Inward donations awaiting completion',
    message: `${total} inward donation(s) still need donor and/or medical history linked before their units can be released`,
    module: 'COLLECTION',
    category: 'INWARD_DONATION_PENDING',
    severity: 'WARNING',
    relatedRecordType: 'Donation',
    actionLink: '/master-register/donations',
    dedupeKey: `INWARD_DONATION_PENDING:${bucket}`,
  });
  if (created) log.info({ total }, 'inward donation incomplete nag sent');
  return total;
}

export function registerDonationJobs(): void {
  const queue = getQueue(QUEUE_NAMES.DONATION_MAINTENANCE);

  queue.process(JOB_INWARD_NAG, async () => runInwardDonationNag());

  void queue.add(
    JOB_INWARD_NAG,
    {},
    {
      repeat: { every: INWARD_NAG_INTERVAL_MS },
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: JOB_INWARD_NAG,
    },
  );

  log.info('inward donation incomplete nag scheduled (every 45 minutes)');
}
