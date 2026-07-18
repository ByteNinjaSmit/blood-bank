import type { NextFunction, Request, Response } from 'express';
import { ValidateDiscard } from '@/modules/discard/discard.validator';
import type { DiscardService } from '@/modules/discard/discard.service';
import { UnauthorizedError } from '@/shared/errors';
import { withAudit } from '@/shared/utils/with-audit';

export interface DiscardControllers {
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createDiscardControllers(service: DiscardService): DiscardControllers {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const filters = ValidateDiscard.listQuery(req);
        const pageNum = filters.page || 1;
        const limitNum = filters.limit || 50;
        const { data, total, totalPages } = await service.list(filters);
        res.json({
          success: true,
          data,
          pagination: { total, totalFiltered: total, totalPages, page: pageNum, limit: limitNum },
        });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const body = ValidateDiscard.createBody(req);
        const actorId = actor(req);
        const { unitsDiscarded, bagNo } = await service.create({ ...body, actorId });
        void withAudit(
          { actorId, requestId: req.id },
          {
            module: 'discard',
            action: 'DISCARD',
            entityType: 'ClinicalDiscard',
            entityId: bagNo,
            severity: 'warning',
            reason: body.description ? `${body.reason}: ${body.description}` : body.reason,
          },
          undefined,
          { bagNo, unitsDiscarded },
        );
        res.json({
          success: true,
          message: `Successfully discarded ${unitsDiscarded} blood unit(s) associated with bag number ${bagNo}.`,
        });
      } catch (e) {
        next(e);
      }
    },
  };
}
