import type { NextFunction, Request, Response } from 'express';
import { ValidateFeedback } from '@/modules/feedback/feedback.validator';
import type { FeedbackService } from '@/modules/feedback/feedback.service';

export interface FeedbackControllers {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export function createFeedbackControllers(service: FeedbackService): FeedbackControllers {
  return {
    async list(req, res, next) {
      try {
        const q = ValidateFeedback.listQuery(req);
        const data = await service.list(q);
        res.json({ success: true, data, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
