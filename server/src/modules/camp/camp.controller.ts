import type { NextFunction, Request, Response } from 'express';
import { ValidateCamp } from './camp.validator';
import { campService } from './camp.service';
import { UnauthorizedError } from '@/shared/errors';
import { extractEditReason } from '@/shared/utils/edit-reason';
import { withAudit } from '@/shared/utils/with-audit';

const actor = (req: Request): string => {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
};
const ok = (req: Request, res: Response, data: unknown) =>
  res.json({ success: true, data, requestId: req.id });

export const campController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await campService.create(ValidateCamp.createBody(req), actor(req));
      res.status(201).json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateCamp.idParam(req);
      const editReason = extractEditReason(req);
      ok(
        req,
        res,
        await campService.update(id, ValidateCamp.updateBody(req), actor(req), editReason),
      );
    } catch (e) {
      next(e);
    }
  },
  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateCamp.idParam(req);
      const { reason } = ValidateCamp.deleteReasonBody(req);
      const data = await campService.remove(id, actor(req), reason);
      res.status(200).json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateCamp.idParam(req);
      const data = await campService.restore(id, actor(req));
      res.status(200).json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateCamp.idParam(req);
      ok(req, res, await campService.detail(id));
    } catch (e) {
      next(e);
    }
  },
  async all(req: Request, res: Response, next: NextFunction) {
    try {
      ok(req, res, await campService.all());
    } catch (e) {
      next(e);
    }
  },
  async campList(req: Request, res: Response, next: NextFunction) {
    try {
      const deletedOnly = req.query.deletedOnly === 'true';
      ok(req, res, await campService.campList(deletedOnly));
    } catch (e) {
      next(e);
    }
  },
  async staffList(req: Request, res: Response, next: NextFunction) {
    try {
      ok(req, res, await campService.staffList());
    } catch (e) {
      next(e);
    }
  },
  async campDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const { campId } = ValidateCamp.campIdParam(req);
      ok(req, res, await campService.campDonations(campId));
    } catch (e) {
      next(e);
    }
  },
  async campDonors(req: Request, res: Response, next: NextFunction) {
    try {
      const { campId } = ValidateCamp.campIdParam(req);
      ok(req, res, await campService.campDonors(campId));
    } catch (e) {
      next(e);
    }
  },
  async voluntary(req: Request, res: Response, next: NextFunction) {
    try {
      const { items, pagination } = await campService.voluntary(ValidateCamp.voluntaryQuery(req));
      res.json({ success: true, data: { items, pagination }, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
  async updateVoluntaryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = ValidateCamp.voluntaryIdParam(req);
      const { status } = ValidateCamp.updateVoluntaryStatusBody(req);
      const data = await campService.updateVoluntaryStatus(id, status);
      if (req.user) {
        void withAudit(
          { actorId: req.user.id, role: req.user.role, requestId: req.id },
          { module: 'camp', action: 'UPDATE', entityType: 'CampDonation', entityId: id },
          undefined,
          { status },
        );
      }
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
};
