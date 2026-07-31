import type { NextFunction, Request, Response } from 'express';
import { ValidateTtiLegacyView } from '@/modules/tti/tti.legacy-view.validator';
import type { TtiLegacyViewService } from '@/modules/tti/tti.legacy-view.service';
import type { TtiRepo } from '@/modules/tti/tti.repository';
import type { TtiService } from '@/modules/tti/tti.service';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '@/shared/errors';

export interface TtiLegacyViewControllers {
  listQuarantined: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  listDecided: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  recordAndFinalize: (req: Request, res: Response, next: NextFunction) => Promise<void>;
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
        const { testResults, technicianId, editReason } = ValidateTtiLegacyView.recordResultsBody(req);
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

        const mappedTests = testResults.map((t) => {
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
            performedAt: new Date(),
          };
        });

        // One combined call so the whole "Save Results" action produces a
        // single audit entry (tests + decision together), not two.
        await deps.ttiService.recordAndFinalize(tti.donationId, mappedTests, actorId, req.id);
        if (isEdit) {
          await deps.tti.setEditMeta(tti.donationId, editReason!.trim(), actorId);
        }

        res.json({ success: true, message: 'Serology results saved and finalized successfully' });
      } catch (e) {
        next(e);
      }
    },
  };
}
