import { getQueue } from '@/core/queue';
import { childLogger } from '@/core/logger';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { notificationCenterService } from '@/modules/notification/notification-center.service';

const log = childLogger({ module: 'requisition-jobs' });
const QUEUE = 'requisition-maintenance';
const JOB_APPROVAL_REMINDER = 'approval-pending-reminder';

export async function runRequisitionApprovalReminder(): Promise<number> {
  const pending = await RequisitionModel.find({
    purpose: 'REQUISITION',
    status: 'PENDING',
    deletedAt: null,
  })
    .select('requisitionId clinicianName')
    .lean();

  let notified = 0;
  for (const req of pending as Array<{ requisitionId: string; clinicianName: string }>) {
    // dedupeKey ensures this fires once per requisition — the hourly scan
    // just re-discovers still-pending ones, already-notified rows are
    // silently skipped by the notification model's unique index.
    const created = await notificationCenterService
      .notify({
        title: 'Requisition awaiting approval',
        message: `Requisition ${req.requisitionId} (${req.clinicianName}) is still pending approval`,
        module: 'ISSUE_BLOOD',
        category: 'REQUISITION_APPROVAL_PENDING',
        severity: 'WARNING',
        relatedRecordId: req.requisitionId,
        relatedRecordType: 'Requisition',
        actionLink: '/requisition',
        dedupeKey: `REQUISITION_APPROVAL_PENDING:${req.requisitionId}`,
      })
      .catch(() => null);
    if (created) notified++;
  }

  log.info({ pending: pending.length, notified }, 'requisition approval reminder scan complete');
  return notified;
}

export function registerRequisitionJobs(): void {
  const queue = getQueue(QUEUE);

  queue.process(JOB_APPROVAL_REMINDER, async () => runRequisitionApprovalReminder());

  void queue.add(
    JOB_APPROVAL_REMINDER,
    {},
    {
      repeat: { cron: '0 * * * *' }, // hourly
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: JOB_APPROVAL_REMINDER,
    },
  );

  log.info('requisition approval reminder scheduled (hourly)');
}
