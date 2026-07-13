import type { NextFunction, Request, Response } from 'express';
import { ValidateDeferral } from '@/modules/deferral/deferral.validator';
import type { DeferralRepo } from '@/modules/deferral/deferral.repository';
import { UnauthorizedError } from '@/shared/errors';
import { withAudit } from '@/shared/utils/with-audit';

export interface DeferralControllers {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  listByDonor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  lift: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createDeferralControllers(repo: DeferralRepo): DeferralControllers {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async create(req, res, next) {
      try {
        const body = ValidateDeferral.createBody(req);
        const actorId = actor(req);
        const created = await repo.create(body, actorId);
        void withAudit(
          { actorId, requestId: req.id },
          { module: 'deferral', action: 'CREATE', entityType: 'Deferral', entityId: created.id },
          undefined,
          { donor: body.donor, type: body.type, reason: body.reason },
        );
        res.status(201).json({ success: true, data: created, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async listByDonor(req, res, next) {
      try {
        const { donorId } = ValidateDeferral.donorIdParam(req);
        const data = await repo.listByDonor(donorId);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async list(req, res, next) {
      try {
        const filter = ValidateDeferral.listQuery(req);
        const { items, total } = await repo.list(filter);
        const totalPages = Math.ceil(total / filter.limit);
        res.json({
          success: true,
          data: items,
          pagination: {
            currentPage: filter.page,
            totalPages,
            totalCount: total,
            pageSize: filter.limit,
            hasNextPage: filter.page < totalPages,
            hasPrevPage: filter.page > 1,
          },
          requestId: req.id,
        });
      } catch (e) {
        next(e);
      }
    },

    async lift(req, res, next) {
      try {
        const { id } = ValidateDeferral.idParam(req);
        const { reason } = ValidateDeferral.liftBody(req);
        const actorId = actor(req);
        await repo.lift(id, actorId, reason);
        void withAudit(
          { actorId, requestId: req.id },
          { module: 'deferral', action: 'UPDATE', entityType: 'Deferral', entityId: id, reason },
          { active: true },
          { active: false },
        );
        res.status(204).end();
      } catch (e) {
        next(e);
      }
    },
  };
}
