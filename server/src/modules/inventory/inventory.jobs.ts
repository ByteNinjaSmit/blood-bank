// Inventory background jobs:
//   1. expireUnits  — auto-transition any past-expiry unit to EXPIRED
//                     (via the state machine + DISCARD_REASON EXPIRED).
//   2. nearExpiryAlert — email the bank a FEFO-ordered list of units
//                        expiring within NEAR_EXPIRY_DAYS.
//
// Scheduled daily through a Bull repeatable job (see register-processors).

import { getQueue } from '@/core/queue';
import { childLogger } from '@/core/logger';
import { env } from '@/core/config/env';
import { invalidate } from '@/core/cache';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { auditService } from '@/modules/audit/audit.service';
import { notificationService } from '@/modules/notification/notification.service';

const log = childLogger({ module: 'inventory-jobs' });
const QUEUE = 'inventory-maintenance';
const JOB = 'daily-expiry-scan';
const SYSTEM_ACTOR = env.SYSTEM_USER_ID;

const units = createUnitRepo();

export async function runExpiryScan(): Promise<{ expired: number; nearExpiry: number }> {
  // 1. Expire past-date units.
  const expiredIds = await units.findExpiredUnitIds();
  let expired = 0;
  for (const unitId of expiredIds) {
    try {
      await units.applyEvent({
        unitId,
        event: 'EXPIRE',
        actorId: SYSTEM_ACTOR,
        reason: 'Auto-expired (past expiry date)',
        set: { discardReason: 'EXPIRED' },
      });
      expired++;
    } catch (err) {
      log.warn({ unitId, err: (err as Error).message }, 'expire transition skipped');
    }
  }
  if (expired > 0) {
    await invalidate('inventory:*');
    await auditService.record({
      actorId: SYSTEM_ACTOR,
      action: 'STATE_TRANSITION',
      entityType: 'BloodUnit',
      entityId: `batch:${expired}`,
      after: { event: 'EXPIRE', count: expired },
      reason: 'daily expiry scan',
    });
  }

  // 2. Near-expiry alert.
  const near = await units.findNearExpiry(env.NEAR_EXPIRY_DAYS);
  if (near.length > 0) {
    const details = near
      .map((u) => `${u.unitId}  ${u.componentType} ${u.aboGroup}${u.rhFactor}  exp ${u.expiresAt.slice(0, 10)}`)
      .join('\n');
    await notificationService.send({
      type: 'NEAR_EXPIRY_ALERT',
      to: env.ADMIN_EMAIL,
      payload: { count: near.length, reportDate: new Date().toISOString().slice(0, 10), details },
    });
  }

  log.info({ expired, nearExpiry: near.length }, 'expiry scan complete');
  return { expired, nearExpiry: near.length };
}

export function registerInventoryJobs(): void {
  const queue = getQueue(QUEUE);

  queue.process(JOB, async () => runExpiryScan());

  // Daily at 08:00. removeOnComplete keeps the repeat slot clean.
  void queue.add(
    JOB,
    {},
    {
      repeat: { cron: '0 8 * * *' },
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: JOB, // single repeatable instance
    },
  );
  log.info('inventory expiry scan scheduled (daily 08:00)');
}
