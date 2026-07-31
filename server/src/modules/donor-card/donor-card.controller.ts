import type { NextFunction, Request, Response } from 'express';
import { ValidateDonorCard } from '@/modules/donor-card/donor-card.validator';
import type { DonorCardRepo } from '@/modules/donor-card/donor-card.repository';
import { UnauthorizedError } from '@/shared/errors';
import { withAudit } from '@/shared/utils/with-audit';

export interface DonorCardControllers {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getByRequisition: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createDonorCardControllers(repo: DonorCardRepo): DonorCardControllers {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async create(req, res, next) {
      try {
        const body = ValidateDonorCard.createBody(req);
        const actorId = actor(req);
        const created = await repo.create(body, actorId);
        void withAudit(
          { actorId, requestId: req.id },
          { module: 'donor-card', action: 'CREATE', entityType: 'DonorCard', entityId: created.id },
          undefined,
          { requisitionId: body.requisitionId },
        );
        res.status(201).json({ success: true, data: created, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async list(req, res, next) {
      try {
        const data = await repo.list();
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async getByRequisition(req, res, next) {
      try {
        const { requisitionId } = ValidateDonorCard.requisitionIdParam(req);
        const [data] = await repo.findByRequisitionIds([requisitionId]);
        res.json({ success: true, data: data || null, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
