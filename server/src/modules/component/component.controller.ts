import type { NextFunction, Request, Response } from 'express';
import { ValidateComponent } from '@/modules/component/component.validator';
import type { ComponentService } from '@/modules/component/component.service';
import { UnauthorizedError } from '@/shared/errors';

export interface ComponentControllers {
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  bagsToSeparate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  separate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  separationCompleted: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  nearExpiry: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  getGroupDetail: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  patch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  patchBag: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  markBatchDraft: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  clearBatchDraft: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createComponentControllers(service: ComponentService): ComponentControllers {
  const actor = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async list(req, res, next) {
      try {
        const filters = ValidateComponent.listQuery(req);
        const { components, total, totalPages } = await service.list(filters);
        res.json({ success: true, components, pagination: { total, totalPages } });
      } catch (e) {
        next(e);
      }
    },

    async bagsToSeparate(_req, res, next) {
      try {
        const bags = await service.listBagsToSeparate();
        res.json({ success: true, bags });
      } catch (e) {
        next(e);
      }
    },

    async separate(req, res, next) {
      try {
        const { donationId, componentType, volumeMl, rpmFirstSpin, rpmSecondSpin, separationTime } =
          ValidateComponent.separateBody(req);
        const unit = await service.separate({
          donationId,
          componentType,
          volumeMl,
          rpmFirstSpin,
          rpmSecondSpin,
          separationTime,
          actorId: actor(req),
        });
        res.json({ success: true, unit });
      } catch (e) {
        next(e);
      }
    },

    async separationCompleted(req, res, next) {
      try {
        const { donationId, signature } = ValidateComponent.separationCompletedBody(req);
        await service.separationCompleted({ donationId, signature, actorId: actor(req) });
        res.json({ success: true, message: 'Separation completed successfully' });
      } catch (e) {
        next(e);
      }
    },

    async nearExpiry(req, res, next) {
      try {
        const filters = ValidateComponent.nearExpiryQuery(req);
        const { components, total, totalPages } = await service.nearExpiry(filters);
        res.json({ success: true, components, pagination: { total, totalPages } });
      } catch (e) {
        next(e);
      }
    },

    async getGroupDetail(req, res, next) {
      try {
        const { id } = ValidateComponent.idParam(req);
        const component = await service.getGroupDetail(id);
        res.json({ success: true, component });
      } catch (e) {
        next(e);
      }
    },

    async patch(req, res, next) {
      try {
        const { id } = ValidateComponent.idParam(req);
        const fields = ValidateComponent.patchBody(req);
        const unit = await service.patch(id, fields, actor(req));
        res.json({ success: true, unit });
      } catch (e) {
        next(e);
      }
    },

    async patchBag(req, res, next) {
      try {
        const { id } = ValidateComponent.idParam(req);
        const fields = ValidateComponent.patchBagBody(req);
        await service.patchBag(id, fields, actor(req));
        res.json({ success: true, message: 'Bag updated successfully' });
      } catch (e) {
        next(e);
      }
    },

    async markBatchDraft(req, res, next) {
      try {
        const { donationIds } = ValidateComponent.batchDraftBody(req);
        await service.setBatchDraftActive(donationIds, true);
        res.json({ success: true });
      } catch (e) {
        next(e);
      }
    },

    async clearBatchDraft(req, res, next) {
      try {
        const { donationIds } = ValidateComponent.batchDraftBody(req);
        await service.setBatchDraftActive(donationIds, false);
        res.json({ success: true });
      } catch (e) {
        next(e);
      }
    },
  };
}
