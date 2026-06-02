// TTI service. The clinical gate: units of a donation can only be
// RELEASED once the mandatory panel is complete and all-negative. A
// reactive panel discards the units AND raises a permanent deferral on
// the donor (and is a lookback trigger).

import { childLogger } from '@/core/logger';
import { TtiQuarantineViolation, NotFoundError } from '@/shared/errors';
import type { INotificationService } from '@/shared/interfaces';
import { notificationService as defaultNotify } from '@/modules/notification/notification.service';
import { evaluateRelease, type PanelEntry } from './tti.release-rules';
import type { TtiRepo, TtiResultDto, TtiTestEntryInput } from '@/modules/tti/tti.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { DeferralRepo } from '@/modules/deferral/deferral.repository';
import type { DonationRepo } from '@/modules/donation/donation.repository';
import type { LookbackService } from '@/modules/lookback/lookback.service';
import type { TtiTest, TtiResult } from '@/shared/enums';

export interface TtiService {
  recordTests(
    donationId: string,
    tests: TtiTestEntryInput[],
    actorId: string,
  ): Promise<TtiResultDto>;
  /** Evaluate panel + apply the decision: release / discard units + deferral. */
  finalize(
    donationId: string,
    actorId: string,
  ): Promise<{
    decision: string;
    unitsAffected: number;
    reasons: string[];
  }>;
  get(donationId: string): Promise<TtiResultDto>;
}

export function createTtiService(deps: {
  tti: TtiRepo;
  units: UnitRepo;
  deferrals: DeferralRepo;
  donations: DonationRepo;
  lookback?: LookbackService;
  counsellorEmail?: string;
  notify?: INotificationService;
}): TtiService {
  const log = childLogger({ module: 'tti-service' });
  const notify = deps.notify ?? defaultNotify;

  return {
    async recordTests(donationId, tests, actorId) {
      const existing = await deps.tti.findByDonation(donationId);
      if (!existing) throw new NotFoundError('TtiResult', donationId);
      return deps.tti.recordTests(donationId, tests, actorId);
    },

    async finalize(donationId, actorId) {
      const tti = await deps.tti.findByDonation(donationId);
      if (!tti) throw new NotFoundError('TtiResult', donationId);

      const panel: PanelEntry[] = tti.tests.map((t) => ({
        testName: t.testName as TtiTest,
        result: t.result as TtiResult,
      }));
      const evaluation = evaluateRelease(panel);

      await deps.tti.setDecision(
        donationId,
        evaluation.decision,
        actorId,
        evaluation.reasons.join('; '),
      );

      let unitsAffected = 0;

      if (evaluation.decision === 'released') {
        // Move units COLLECTED/IN_TESTING -> QUARANTINE -> RELEASED.
        // Units start at COLLECTED after donation; ensure they pass
        // through the legal chain.
        await deps.units.applyEventToDonation(donationId, 'BEGIN_TESTING', actorId, ['COLLECTED']);
        await deps.units.applyEventToDonation(donationId, 'AWAIT_TTI', actorId, ['IN_TESTING']);
        unitsAffected = await deps.units.applyEventToDonation(donationId, 'RELEASE', actorId, [
          'QUARANTINE',
        ]);
        log.info({ donationId, unitsAffected }, 'TTI released units');
      } else if (evaluation.decision === 'reactive') {
        // Discard every unit of this donation, raise a permanent
        // deferral, and flag for lookback.
        unitsAffected = await deps.units.applyEventToDonation(donationId, 'DISCARD', actorId, [
          'COLLECTED',
          'IN_TESTING',
          'QUARANTINE',
          'RELEASED',
          'RESERVED',
          'CROSSMATCHED',
        ]);
        const donation = await deps.donations.findById(donationId).catch(() => null);
        const donorId = donation?.donor;
        if (donorId) {
          await deps.deferrals.create(
            {
              donor: donorId,
              type: 'PERMANENT',
              reason: `TTI reactive: ${evaluation.reasons.join(', ')}`,
              source: 'TTI_REACTIVE',
              relatedDonationId: donationId,
            },
            actorId,
          );
        }

        // Auto-trigger lookback (trace + recall recipients) and alert
        // the counsellor. Best-effort — never block the TTI decision.
        if (deps.lookback) {
          await deps.lookback
            .runForDonation(donationId, actorId, deps.counsellorEmail)
            .catch((err) =>
              log.error({ donationId, err: (err as Error).message }, 'auto-lookback failed'),
            );
        }
        if (deps.counsellorEmail) {
          await notify
            .send({
              type: 'TTI_REACTIVE_ALERT',
              to: deps.counsellorEmail,
              payload: {
                donationId,
                reactiveTests: evaluation.reasons,
                counsellorEmail: deps.counsellorEmail,
              },
            })
            .catch(() => undefined);
        }

        log.warn(
          { donationId, unitsAffected, reasons: evaluation.reasons, donorId },
          'TTI reactive — units discarded, donor permanently deferred, LOOKBACK triggered',
        );
      } else {
        // pending / indeterminate / on-hold: do not move units.
        log.info({ donationId, decision: evaluation.decision }, 'TTI not releasable yet');
      }

      return {
        decision: evaluation.decision,
        unitsAffected,
        reasons: evaluation.reasons,
      };
    },

    async get(donationId) {
      const tti = await deps.tti.findByDonation(donationId);
      if (!tti) throw new NotFoundError('TtiResult', donationId);
      return tti;
    },
  };
}

// Exported guard usable by other services (e.g. issue) to assert a
// unit's donation cleared TTI before it can leave the bank.
export function assertTtiReleased(decision: string, donationId: string): void {
  if (decision !== 'released') {
    throw new TtiQuarantineViolation(
      `Donation ${donationId} TTI not released (decision=${decision})`,
      { donationId, decision },
    );
  }
}
