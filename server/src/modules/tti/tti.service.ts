// TTI service. The clinical gate: units of a donation can only be
// RELEASED once the mandatory panel is complete and all-negative. A
// reactive panel discards the units AND raises a permanent deferral on
// the donor (and is a lookback trigger). A "shadeness" (indeterminate)
// panel holds any already-released units back in quarantine (not
// discarded — pending retest) and raises a temporary deferral.

import { childLogger } from '@/core/logger';
import { withAudit } from '@/shared/utils/with-audit';
import { TtiQuarantineViolation, NotFoundError } from '@/shared/errors';
import type { INotificationService } from '@/shared/interfaces';
import { notificationService as defaultNotify } from '@/modules/notification/notification.service';
import { notificationCenterService } from '@/modules/notification/notification-center.service';
import { evaluateRelease, type PanelEntry } from './tti.release-rules';
import type { TtiRepo, TtiResultDto, TtiTestEntryInput } from '@/modules/tti/tti.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { DeferralRepo } from '@/modules/deferral/deferral.repository';
import type { DonationRepo } from '@/modules/donation/donation.repository';
import type { LookbackService } from '@/modules/lookback/lookback.service';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import type { TtiTest, TtiResult } from '@/shared/enums';

// Standard re-test hold period for a shadeness (indeterminate) result —
// donor is temporarily deferred, eligible again after this window
// unless the retest itself resolves it sooner (which lifts the
// deferral immediately regardless of this date).
const SHADENESS_DEFERRAL_DAYS = 90;

export interface FinalizeResult {
  decision: string;
  unitsAffected: number;
  reasons: string[];
}

export interface TtiService {
  recordTests(
    donationId: string,
    tests: TtiTestEntryInput[],
    actorId: string,
  ): Promise<TtiResultDto>;
  /** Evaluate panel + apply the decision: release / discard units + deferral. */
  finalize(donationId: string, actorId: string, requestId?: string): Promise<FinalizeResult>;
  /**
   * Combined record-then-finalize used by the single "Save Results" UI
   * action (Serology entry/edit screens) so it produces exactly ONE
   * audit entry (tests + decision together) instead of two.
   *
   * `requestId` (the originating HTTP request id) is threaded through to
   * every unit-transition audit entry this call cascades, so the Audit
   * Trail UI can group "all components quarantined by this one TTI
   * edit" together instead of showing them as unrelated rows.
   */
  recordAndFinalize(
    donationId: string,
    tests: TtiTestEntryInput[],
    actorId: string,
    requestId?: string,
  ): Promise<FinalizeResult>;
  get(donationId: string): Promise<TtiResultDto>;
}

export function createTtiService(deps: {
  tti: TtiRepo;
  units: UnitRepo;
  deferrals: DeferralRepo;
  donations: DonationRepo;
  bagStock?: BagStockRepo;
  lookback?: LookbackService;
  counsellorEmail?: string;
  notify?: INotificationService;
}): TtiService {
  const log = childLogger({ module: 'tti-service' });
  const notify = deps.notify ?? defaultNotify;

  // Applies the side effects for a freshly-evaluated decision (unit
  // transitions, bag stock reversal, deferrals, lookback) WITHOUT
  // writing any audit entry itself — callers own the audit write so a
  // single user action (record + finalize together) produces one
  // combined log instead of two.
  async function applyDecision(
    donationId: string,
    actorId: string,
    tti: TtiResultDto,
    evaluation: ReturnType<typeof evaluateRelease>,
    requestId?: string,
  ): Promise<number> {
    let unitsAffected = 0;

    if (evaluation.decision === 'released') {
      // If this donation was previously marked reactive and the edit
      // now corrects it to released, undo the reactive side effects
      // first: reinstate the units/components this service discarded,
      // reverse the BagStock counters, and lift the permanent deferral
      // it raised — before walking the normal release chain below.
      if (tti.releaseDecision === 'reactive') {
        const reinstated = await deps.units.applyEventToDonation(
          donationId,
          'REINSTATE',
          actorId,
          ['DISCARDED'],
          'TTI result corrected: reactive -> released',
          { match: { discardReason: 'TTI_POSITIVE' }, set: { discardReason: null }, requestId },
        );

        const priorDonation = await deps.donations.findByDonationId(donationId).catch(() => null);
        if (priorDonation && priorDonation.lotNo && priorDonation.typeOfBag && deps.bagStock) {
          const mappedBagType =
            priorDonation.typeOfBag === 'DB' ? 'DOUBLE' : priorDonation.typeOfBag === 'TB' ? 'TRIPLE' : null;
          if (mappedBagType) {
            try {
              const bagStock = await deps.bagStock.findByBatchAndType(priorDonation.lotNo, mappedBagType);
              if (bagStock) {
                await deps.bagStock.decrementDiscarded(bagStock.id, 1, actorId);
                await deps.bagStock.incrementIssued(bagStock.id, 1, actorId);
                log.info(
                  { donationId, batchNumber: priorDonation.lotNo, bagType: mappedBagType },
                  'Bag stock reverted: discarded decremented, issued incremented after TTI correction',
                );
              }
            } catch (err) {
              log.error({ err: (err as Error).message }, 'Failed to revert BagStock after TTI correction');
            }
          }
        }

        const deferral = await deps.deferrals.findByRelatedDonation(donationId, 'TTI_REACTIVE');
        if (deferral) {
          await deps.deferrals.lift(
            deferral.id,
            actorId,
            'TTI result corrected to released — reactive finding reversed',
          );
        }

        log.warn(
          { donationId, reinstated, deferralLifted: Boolean(deferral) },
          'TTI correction: reactive discard reversed, units reinstated, deferral lifted',
        );
      }

      // Retest cleared a prior shadeness hold — lift the temporary
      // deferral it raised and let the units below flow QUARANTINE -> RELEASED.
      if (tti.releaseDecision === 'indeterminate') {
        const shadenessDeferral = await deps.deferrals.findByRelatedDonation(donationId, 'TTI_INDETERMINATE');
        if (shadenessDeferral) {
          await deps.deferrals.lift(
            shadenessDeferral.id,
            actorId,
            'TTI shadeness result resolved — retest clear',
          );
          log.info({ donationId }, 'TTI correction: shadeness deferral lifted after clean retest');
        }
      }

      // Move units COLLECTED/IN_TESTING -> QUARANTINE -> RELEASED. Units
      // already held in QUARANTINE by a prior shadeness hold flow
      // straight through this same RELEASE step.
      await deps.units.applyEventToDonation(donationId, 'BEGIN_TESTING', actorId, ['COLLECTED'], undefined, { requestId });
      await deps.units.applyEventToDonation(donationId, 'AWAIT_TTI', actorId, ['IN_TESTING'], undefined, { requestId });
      unitsAffected = await deps.units.applyEventToDonation(
        donationId,
        'RELEASE',
        actorId,
        ['QUARANTINE'],
        undefined,
        { requestId },
      );
      log.info({ donationId, unitsAffected }, 'TTI released units');
      void notificationCenterService
        .notify({
          title: 'TTI testing completed',
          message: `TTI panel for donation ${donationId} cleared — ${unitsAffected} unit(s) released`,
          module: 'TTI_TESTING',
          category: 'TESTING_COMPLETED',
          severity: 'SUCCESS',
          relatedRecordId: donationId,
          relatedRecordType: 'Donation',
          actionLink: `/labs/serology-results`,
        })
        .catch(() => undefined);
    } else if (evaluation.decision === 'reactive') {
      // Discard every unit of this donation (including any currently
      // held in QUARANTINE by a shadeness hold), raise a permanent
      // deferral, and flag for lookback.
      unitsAffected = await deps.units.applyEventToDonation(
        donationId,
        'DISCARD',
        actorId,
        ['COLLECTED', 'IN_TESTING', 'QUARANTINE', 'RELEASED', 'RESERVED', 'CROSSMATCHED'],
        'TTI reactive',
        { set: { discardReason: 'TTI_POSITIVE' }, requestId },
      );
      const donation = await deps.donations.findByDonationId(donationId).catch(() => null);
      const donorId = donation?.donor;

      if (donation && donation.lotNo && donation.typeOfBag) {
        const mappedBagType = donation.typeOfBag === 'DB' ? 'DOUBLE' : donation.typeOfBag === 'TB' ? 'TRIPLE' : null;
        if (mappedBagType && deps.bagStock) {
          try {
            const bagStock = await deps.bagStock.findByBatchAndType(donation.lotNo, mappedBagType);
            if (bagStock) {
              await deps.bagStock.decrementIssued(bagStock.id, 1, actorId);
              await deps.bagStock.incrementDiscarded(bagStock.id, 1, actorId);
              log.info({ donationId, batchNumber: donation.lotNo, bagType: mappedBagType }, 'Bag stock updated: issued decremented, discarded incremented due to reactive TTI');
            }
          } catch (err) {
            log.error({ err: (err as Error).message }, 'Failed to update BagStock for reactive donation');
          }
        }
      }

      // A prior shadeness hold is superseded by the permanent deferral
      // raised below — lift it so the donor isn't carrying two active
      // deferrals for the same donation.
      if (tti.releaseDecision === 'indeterminate') {
        const shadenessDeferral = await deps.deferrals.findByRelatedDonation(donationId, 'TTI_INDETERMINATE');
        if (shadenessDeferral) {
          await deps.deferrals.lift(shadenessDeferral.id, actorId, 'Superseded by permanent TTI reactive deferral');
        }
      }

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
      void notificationCenterService
        .notify({
          title: 'Reactive TTI sample detected',
          message: `Donation ${donationId} reactive: ${evaluation.reasons.join(', ')} — units discarded, lookback triggered`,
          module: 'TTI_TESTING',
          category: 'TTI_REACTIVE',
          severity: 'CRITICAL',
          relatedRecordId: donationId,
          relatedRecordType: 'Donation',
          actionLink: `/labs/serology-results`,
        })
        .catch(() => undefined);
    } else if (evaluation.decision === 'indeterminate') {
      // If this donation was previously reactive (units discarded), a
      // correction down to indeterminate must first pull those units out
      // of DISCARDED — REINSTATE lands them directly in QUARANTINE, which
      // is exactly where a shadeness hold belongs — and reverse the
      // BagStock discard counters + permanent deferral raised for the
      // reactive finding, mirroring the reactive->released reversal above.
      let reinstatedFromDiscard = 0;
      if (tti.releaseDecision === 'reactive') {
        reinstatedFromDiscard = await deps.units.applyEventToDonation(
          donationId,
          'REINSTATE',
          actorId,
          ['DISCARDED'],
          'TTI result corrected: reactive -> indeterminate',
          { match: { discardReason: 'TTI_POSITIVE' }, set: { discardReason: null }, requestId },
        );

        const priorDonation = await deps.donations.findByDonationId(donationId).catch(() => null);
        if (priorDonation && priorDonation.lotNo && priorDonation.typeOfBag && deps.bagStock) {
          const mappedBagType =
            priorDonation.typeOfBag === 'DB' ? 'DOUBLE' : priorDonation.typeOfBag === 'TB' ? 'TRIPLE' : null;
          if (mappedBagType) {
            try {
              const bagStock = await deps.bagStock.findByBatchAndType(priorDonation.lotNo, mappedBagType);
              if (bagStock) {
                await deps.bagStock.decrementDiscarded(bagStock.id, 1, actorId);
                await deps.bagStock.incrementIssued(bagStock.id, 1, actorId);
                log.info(
                  { donationId, batchNumber: priorDonation.lotNo, bagType: mappedBagType },
                  'Bag stock reverted: discarded decremented, issued incremented after TTI reactive->indeterminate correction',
                );
              }
            } catch (err) {
              log.error(
                { err: (err as Error).message },
                'Failed to revert BagStock after TTI reactive->indeterminate correction',
              );
            }
          }
        }

        const reactiveDeferral = await deps.deferrals.findByRelatedDonation(donationId, 'TTI_REACTIVE');
        if (reactiveDeferral) {
          await deps.deferrals.lift(
            reactiveDeferral.id,
            actorId,
            'TTI result corrected: reactive finding downgraded to indeterminate',
          );
        }

        log.warn(
          { donationId, reinstatedFromDiscard },
          'TTI correction: reactive discard reversed to quarantine, permanent deferral lifted',
        );
      }

      // Shadeness: do NOT release or discard anything further. Any unit
      // already sitting in stock (RELEASED) for this donation is pulled back
      // into QUARANTINE — invisible to requisition matching (selectable()
      // only looks at RELEASED units) — until the result resolves.
      // Units still upstream of release (COLLECTED/IN_TESTING/QUARANTINE)
      // are simply left alone; they were never released in the first place.
      const quarantinedFromReleased = await deps.units.applyEventToDonation(
        donationId,
        'QUARANTINE_HOLD',
        actorId,
        ['RELEASED'],
        `TTI shadeness: ${evaluation.reasons.join(', ')}`,
        { requestId },
      );
      unitsAffected = reinstatedFromDiscard + quarantinedFromReleased;

      const donation = await deps.donations.findByDonationId(donationId).catch(() => null);
      const donorId = donation?.donor;

      // Only raise one active shadeness deferral per donation — a
      // second finalize() call while still indeterminate (e.g. a second
      // test came back, panel still not clear) must not duplicate it.
      if (donorId) {
        const existing = await deps.deferrals.findByRelatedDonation(donationId, 'TTI_INDETERMINATE');
        if (!existing) {
          const untilDate = new Date();
          untilDate.setDate(untilDate.getDate() + SHADENESS_DEFERRAL_DAYS);
          await deps.deferrals.create(
            {
              donor: donorId,
              type: 'TEMPORARY',
              reason: `TTI shadeness (indeterminate result): ${evaluation.reasons.join(', ')} — donor temporarily deferred pending retest`,
              untilDate,
              source: 'TTI_INDETERMINATE',
              relatedDonationId: donationId,
            },
            actorId,
          );
          log.warn({ donationId, donorId, unitsAffected }, 'TTI shadeness — units quarantined, donor temporarily deferred');
        }
      }
    } else {
      // pending / on-hold: do not move units.
      log.info({ donationId, decision: evaluation.decision }, 'TTI not releasable yet');
    }

    return unitsAffected;
  }

  return {
    async recordTests(donationId, tests, actorId) {
      const existing = await deps.tti.findByDonation(donationId);
      if (!existing) throw new NotFoundError('TtiResult', donationId);
      const result = await deps.tti.recordTests(donationId, tests, actorId);
      void withAudit(
        { actorId },
        {
          module: 'tti',
          action: 'UPDATE',
          entityType: 'TTIResult',
          entityId: donationId,
          entityLabel: donationId,
        },
        { tests: existing.tests },
        { tests },
      );
      return result;
    },

    async finalize(donationId, actorId, requestId) {
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

      void withAudit(
        { actorId, requestId },
        {
          module: 'tti',
          action: evaluation.decision === 'released' ? 'RELEASE' : 'UPDATE',
          entityType: 'TTIResult',
          entityId: donationId,
          entityLabel: donationId,
          severity: evaluation.decision === 'reactive' ? 'critical' : evaluation.decision === 'indeterminate' ? 'warning' : 'info',
          reason: evaluation.reasons.join('; '),
        },
        { releaseDecision: tti.releaseDecision },
        { releaseDecision: evaluation.decision },
      );

      const unitsAffected = await applyDecision(donationId, actorId, tti, evaluation, requestId);

      return { decision: evaluation.decision, unitsAffected, reasons: evaluation.reasons };
    },

    async recordAndFinalize(donationId, tests, actorId, requestId) {
      const before = await deps.tti.findByDonation(donationId);
      if (!before) throw new NotFoundError('TtiResult', donationId);

      const afterDto = await deps.tti.recordTests(donationId, tests, actorId);

      const panel: PanelEntry[] = afterDto.tests.map((t) => ({
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

      const unitsAffected = await applyDecision(donationId, actorId, before, evaluation, requestId);

      // ONE combined audit entry for the whole "Save Results" action —
      // both the test-panel diff and the decision diff together.
      void withAudit(
        { actorId, requestId },
        {
          module: 'tti',
          action: evaluation.decision === 'released' ? 'RELEASE' : 'UPDATE',
          entityType: 'TTIResult',
          entityId: donationId,
          entityLabel: donationId,
          severity: evaluation.decision === 'reactive' ? 'critical' : evaluation.decision === 'indeterminate' ? 'warning' : 'info',
          reason: evaluation.reasons.join('; '),
        },
        { tests: before.tests, releaseDecision: before.releaseDecision },
        { tests: afterDto.tests, releaseDecision: evaluation.decision },
      );

      return { decision: evaluation.decision, unitsAffected, reasons: evaluation.reasons };
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
