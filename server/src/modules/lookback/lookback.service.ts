// Lookback service. When a donor turns reactive: trace recipients,
// recall in-stock units (DISCARD via state machine), audit, and email
// the recall to the bank officer. Triggered automatically by the TTI
// service on a reactive finalize, or manually by a BBO.

import { childLogger } from '@/core/logger';
import { auditService } from '@/modules/audit/audit.service';
import { notificationService } from '@/modules/notification/notification.service';
import type { LookbackRepo, LookbackTrace } from './lookback.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';

export interface LookbackResult extends LookbackTrace {
  recalledUnitIds: string[];
}

export interface LookbackService {
  runForDonation(
    donationId: string,
    actorId: string,
    notifyEmail?: string,
  ): Promise<LookbackResult>;
  runForDonor(donorId: string, actorId: string, notifyEmail?: string): Promise<LookbackResult>;
}

export function createLookbackService(deps: {
  lookback: LookbackRepo;
  units: UnitRepo;
}): LookbackService {
  const log = childLogger({ module: 'lookback-service' });

  async function execute(
    trace: LookbackTrace,
    actorId: string,
    notifyEmail: string | undefined,
    sourceDonationId: string,
  ): Promise<LookbackResult> {
    // Recall (discard) every still-in-stock unit from this donor.
    const recalledUnitIds: string[] = [];
    for (const unitId of trace.inStockUnitIds) {
      try {
        await deps.units.applyEvent({
          unitId,
          event: 'DISCARD',
          actorId,
          reason: `Lookback recall (donor reactive) — source ${sourceDonationId}`,
          set: { discardReason: 'DONOR_RECALL' },
        });
        recalledUnitIds.push(unitId);
      } catch (err) {
        log.warn({ unitId, err: (err as Error).message }, 'recall transition failed');
      }
    }

    await auditService.record({
      actorId,
      action: 'OVERRIDE',
      entityType: 'Lookback',
      entityId: sourceDonationId,
      after: {
        recalledUnitIds,
        recipients: trace.recipients.length,
        unitsTraced: trace.unitIds.length,
      },
      reason: 'donor TTI reactive lookback',
    });

    if (notifyEmail) {
      await notificationService.send({
        type: 'LOOKBACK_RECALL',
        to: notifyEmail,
        payload: {
          donationId: sourceDonationId,
          affectedUnitIds: recalledUnitIds,
          recipientCount: trace.recipients.length,
        },
      });
    }

    log.warn(
      {
        donorId: trace.donorId,
        sourceDonationId,
        recalled: recalledUnitIds.length,
        recipients: trace.recipients.length,
      },
      'LOOKBACK executed',
    );

    return { ...trace, recalledUnitIds };
  }

  return {
    async runForDonation(donationId, actorId, notifyEmail) {
      const trace = await deps.lookback.traceByDonation(donationId);
      return execute(trace, actorId, notifyEmail, donationId);
    },
    async runForDonor(donorId, actorId, notifyEmail) {
      const trace = await deps.lookback.traceByDonor(donorId);
      return execute(trace, actorId, notifyEmail, `donor:${donorId}`);
    },
  };
}
