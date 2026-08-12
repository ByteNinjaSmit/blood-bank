import type { NextFunction, Request, Response } from 'express';
import { ValidateTtiLegacyView } from '@/modules/tti/tti.legacy-view.validator';
import type { TtiLegacyViewService } from '@/modules/tti/tti.legacy-view.service';
import type { TtiRepo } from '@/modules/tti/tti.repository';
import type { TtiService } from '@/modules/tti/tti.service';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import { auditRepository } from '@/modules/audit/audit.repository';
import { hasPendingResult } from '@/modules/tti/tti.release-rules';
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '@/shared/errors';

export interface TtiLegacyViewControllers {
  listQuarantined: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  listDecided: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  recordAndFinalize: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  recordAndFinalizeBatch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  markBatchDraft: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  clearBatchDraft: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

// Legacy display keys (HIV/HBsAg/HCV/VDRL/MP, Title-case results) -> the
// real TTI_TEST/TTI_RESULT enum values the domain layer stores.
function mapLegacyTestResults(
  testResults: Array<{ test: string; result: string }>,
  technicianId: string | undefined,
  actorId: string,
  performedAt?: Date,
) {
  return testResults.map((t) => {
    let testName = t.test.toUpperCase();
    if (testName === 'VDRL') testName = 'SYPHILIS';
    if (testName === 'MP') testName = 'MALARIA';

    let result = t.result.toUpperCase();
    if (result === 'SHADENESS') result = 'INDETERMINATE';

    return {
      testName: testName as any,
      method: 'ELISA' as const,
      result: result as any,
      technicianId: technicianId || actorId,
      performedAt: performedAt || new Date(),
    };
  });
}

// Reverse of mapLegacyTestResults's testName/result mapping — for
// presenting a stored TtiResult.tests entry (or an audit before/after
// snapshot of one) back in the UI's legacy vocabulary.
function toLegacyTestName(testName: string): string {
  if (testName === 'SYPHILIS') return 'VDRL';
  if (testName === 'MALARIA') return 'MP';
  return testName;
}
function toLegacyResult(result: string): string {
  if (result === 'INDETERMINATE') return 'Shadeness';
  if (result === 'PENDING') return 'Pending';
  if (result === 'NEGATIVE') return 'Negative';
  if (result === 'REACTIVE') return 'Reactive';
  return result;
}
function toLegacyPanel(tests: unknown): Array<{ test: string; result: string }> {
  if (!Array.isArray(tests)) return [];
  return tests.map((t: any) => ({
    test: toLegacyTestName(String(t?.testName)),
    result: toLegacyResult(String(t?.result)),
  }));
}

export function createTtiLegacyViewControllers(deps: {
  view: TtiLegacyViewService;
  tti: TtiRepo;
  ttiService: TtiService;
  units: UnitRepo;
}): TtiLegacyViewControllers {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async listQuarantined(req, res, next) {
      try {
        const filters = ValidateTtiLegacyView.bagListQuery(req);
        const result = await deps.view.listQuarantined(filters);
        res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            totalPages: result.totalPages,
            page: result.page,
            limit: result.limit,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    async listDecided(req, res, next) {
      try {
        const filters = ValidateTtiLegacyView.resultListQuery(req);
        const result = await deps.view.listDecided(filters);
        res.json({
          success: true,
          data: result.data,
          pagination: {
            total: result.total,
            totalPages: result.totalPages,
            page: result.page,
            limit: result.limit,
          },
        });
      } catch (e) {
        next(e);
      }
    },

    // Records tests and finalizes (releases/quarantines) in one call, so
    // it needs both the tti:edit and tti:release gates enforced in routes.
    async recordAndFinalize(req, res, next) {
      try {
        const { id } = ValidateTtiLegacyView.resultIdParam(req);
        const { testResults, technicianId, editReason, performedAt } =
          ValidateTtiLegacyView.recordResultsBody(req);
        const actorId = actor(req);

        const tti = await deps.tti.resolveByIdOrDonation(id);
        if (!tti) throw new NotFoundError('TtiResult', id);

        const isEdit = tti.releaseDecision !== 'pending';
        if (isEdit) {
          const issued = await deps.units.findDonationsWithIssuedUnit([tti.donationId]);
          if (issued.has(tti.donationId)) {
            throw new ForbiddenError(
              'This bag has an issued component — TTI results are now permanently read-only',
            );
          }
          if (!editReason || !editReason.trim()) {
            throw new ValidationError('A reason is required to edit finalized TTI results');
          }
        }

        // A bag held in the Pending tab (any latest test result 'PENDING')
        // gets retested through the same recordAndFinalize path as a
        // Shadeness correction, but the retest must not surface as an
        // "edited"/"retest done" marker anywhere the donor/donation/
        // component name is shown — only the audit trail (via
        // recordAndFinalize's tests+decision diff below, which already
        // captures before=Pending/after=<chosen result>) keeps that record.
        const wasPendingOrigin =
          isEdit &&
          hasPendingResult(
            tti.tests.map((t) => ({ testName: t.testName as any, result: t.result as any })),
          );

        const mappedTests = mapLegacyTestResults(
          testResults,
          technicianId,
          actorId,
          performedAt ? new Date(performedAt) : undefined,
        );

        // One combined call so the whole "Save Results" action produces a
        // single audit entry (tests + decision together), not two.
        await deps.ttiService.recordAndFinalize(
          tti.donationId,
          mappedTests,
          actorId,
          req.id,
          isEdit ? editReason!.trim() : undefined,
        );
        if (isEdit && !wasPendingOrigin) {
          await deps.tti.setEditMeta(tti.donationId, editReason!.trim(), actorId);
        }

        res.json({ success: true, message: 'Serology results saved and finalized successfully' });
      } catch (e) {
        next(e);
      }
    },

    // Batch entry: many bags recorded + finalized in one request. Scoped to
    // bags still 'pending' (fresh entry only) — a bag already decided is
    // reported as a per-item failure telling the operator to use the
    // existing single-bag edit/retest flow instead, so the retest audit
    // trail (which requires a typed reason) stays exactly as it is today.
    // Not all-or-nothing across bags: each donation's own unit transitions
    // already run inside their own Mongo session, so one bad item shouldn't
    // block the other 99 from saving.
    async recordAndFinalizeBatch(req, res, next) {
      try {
        const { items, technicianId, performedAt } = ValidateTtiLegacyView.recordResultsBatchBody(req);
        const actorId = actor(req);
        const performedAtDate = performedAt ? new Date(performedAt) : undefined;

        const results: Array<{ id: string; donationId: string; decision: string; unitsAffected: number }> = [];
        const failures: Array<{ id: string; message: string }> = [];

        for (const item of items) {
          try {
            const tti = await deps.tti.resolveByIdOrDonation(item.id);
            if (!tti) throw new NotFoundError('TtiResult', item.id);

            if (tti.releaseDecision !== 'pending') {
              throw new ForbiddenError(
                'This bag already has a decision recorded — use the edit/retest action instead of batch entry',
              );
            }

            const issued = await deps.units.findDonationsWithIssuedUnit([tti.donationId]);
            if (issued.has(tti.donationId)) {
              throw new ForbiddenError(
                'This bag has an issued component — TTI results are now permanently read-only',
              );
            }

            const mappedTests = mapLegacyTestResults(item.testResults, technicianId, actorId, performedAtDate);
            const outcome = await deps.ttiService.recordAndFinalize(
              tti.donationId,
              mappedTests,
              actorId,
              req.id,
            );

            results.push({
              id: item.id,
              donationId: tti.donationId,
              decision: outcome.decision,
              unitsAffected: outcome.unitsAffected,
            });
          } catch (err) {
            failures.push({ id: item.id, message: (err as Error).message || 'Failed to save' });
          }
        }

        res.json({ success: true, data: { results, failures } });
      } catch (e) {
        next(e);
      }
    },

    // Retest history for one bag/donation — every prior correction/retest
    // (audit entries whose "before" snapshot was already decided, i.e. not
    // the initial entry), each showing the full before/after test panel.
    // withAudit already persists the complete tests[] snapshot on every
    // recordAndFinalize call (tti.service.ts), so no separate history
    // storage is needed — this just reads and filters the existing trail.
    async getHistory(req, res, next) {
      try {
        const { id } = ValidateTtiLegacyView.resultIdParam(req);
        const tti = await deps.tti.resolveByIdOrDonation(id);
        if (!tti) throw new NotFoundError('TtiResult', id);

        const entries = (await auditRepository.findForEntity('TTIResult', tti.donationId)) as Array<{
          at: Date;
          before?: { releaseDecision?: string; tests?: unknown };
          after?: { releaseDecision?: string; tests?: unknown };
        }>;

        const history = entries
          .filter((e) => e.before?.releaseDecision && e.before.releaseDecision !== 'pending')
          .map((e) => ({
            at: e.at,
            decisionBefore: e.before?.releaseDecision,
            decisionAfter: e.after?.releaseDecision,
            before: toLegacyPanel(e.before?.tests),
            after: toLegacyPanel(e.after?.tests),
          }))
          .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

        res.json({ success: true, data: history });
      } catch (e) {
        next(e);
      }
    },

    // Batch-draft flag: marks/clears Donation.ttiBatchActive so the
    // donation timeline can show "Under Testing" while a bag sits selected
    // (not yet submitted) in the Serology batch-test queue. No TtiResult
    // is touched by either of these — same idea as component's
    // /batch-draft for separation.
    async markBatchDraft(req, res, next) {
      try {
        const { donationIds } = ValidateTtiLegacyView.batchDraftBody(req);
        await deps.view.setBatchDraftActive(donationIds, true);
        res.json({ success: true });
      } catch (e) {
        next(e);
      }
    },

    async clearBatchDraft(req, res, next) {
      try {
        const { donationIds } = ValidateTtiLegacyView.batchDraftBody(req);
        await deps.view.setBatchDraftActive(donationIds, false);
        res.json({ success: true });
      } catch (e) {
        next(e);
      }
    },
  };
}
