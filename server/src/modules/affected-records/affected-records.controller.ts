import type { NextFunction, Request, Response } from 'express';
import { affectedRecordsService } from './affected-records.service';

export const affectedRecordsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await affectedRecordsService.list();
      res.json({ success: true, data, requestId: req.id });
    } catch (e) {
      next(e);
    }
  },
};
