// HTTP only. Validate, call service, format response. Errors thrown
// here flow through the single error middleware.

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Validate } from '@/modules/donor/donor.validator';
import type { DonorService } from '@/modules/donor/donor.service';
import { UnauthorizedError, ValidationError } from '@/shared/errors';
import { searchDonors, searchDonorsByVector } from '@/core/search/vector-search';
import { toDto } from './donor.repository';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import mongoose from 'mongoose';

export interface DonorControllers {
  create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  remove: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  search: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  vectorSearch: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

const SearchQuery = z.object({
  q: z.string().trim().min(1).max(200),
  bloodGroup: z.enum(['O', 'A', 'B', 'AB']).optional(),
  rh: z.enum(['POSITIVE', 'NEGATIVE']).optional(),
  eligibilityStatus: z.enum(['eligible', 'deferred', 'temp-deferred']).optional(),
  onlyEligible: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

const VectorSearchBody = z.object({
  embedding: z.array(z.number()).length(768, 'Embedding must be 768-dimensional'),
  bloodGroup: z.enum(['O', 'A', 'B', 'AB']).optional(),
  eligibilityStatus: z.enum(['eligible', 'deferred', 'temp-deferred']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export function createDonorControllers(service: DonorService): DonorControllers {
  const actorIdOrThrow = (req: Request): string => {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  };

  return {
    async create(req, res, next) {
      try {
        const body = Validate.createBody(req);
        const created = await service.register(body, actorIdOrThrow(req));
        res.status(201).json({ success: true, data: created, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const { id } = Validate.idParam(req);
        const body = Validate.updateBody(req);
        const updated = await service.update(id, body, actorIdOrThrow(req));
        res.json({ success: true, data: updated, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async get(req, res, next) {
      try {
        const { id } = Validate.idParam(req);
        const donor = await service.get(id);
        if (!donor) {
          res.status(404).json({
            success: false,
            code: 'NOT_FOUND',
            message: 'Donor not found',
            requestId: req.id,
          });
          return;
        }
        res.json({ success: true, data: donor, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async list(req, res, next) {
      try {
        const query = Validate.listQuery(req);
        const result = await service.list(query);
        res.json({ success: true, data: result, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },

    async remove(req, res, next) {
      try {
        const { id } = Validate.idParam(req);
        actorIdOrThrow(req);
        await service.remove(id);
        res.status(204).end();
      } catch (e) {
        next(e);
      }
    },

    async search(req, res, next) {
      try {
        const parsed = SearchQuery.safeParse(req.query);
        if (!parsed.success) throw new ValidationError('Invalid search query', parsed.error.issues);
        const { q, bloodGroup, rh, eligibilityStatus, onlyEligible, limit, skip } = parsed.data;
        const result = await searchDonors({
          query: q,
          bloodGroup,
          rh,
          eligibilityStatus,
          onlyEligible,
          limit,
          skip,
        });
        const mappedItems = [];
        for (const item of (result.items || [])) {
          const dto = toDto(item);
          if (dto.eligibilityStatus === 'deferred' || dto.eligibilityStatus === 'temp-deferred') {
            const activeDeferral = await DeferralModel.findOne({
              donor: new mongoose.Types.ObjectId(dto.id),
              liftedAt: null,
              $or: [
                { type: 'PERMANENT' },
                { type: 'TEMPORARY', untilDate: { $gt: new Date() } }
              ]
            }).sort({ createdAt: -1 }).lean();
            if (activeDeferral) {
              dto.deferralReason = activeDeferral.reason;
              dto.deferralUntil = activeDeferral.untilDate ? activeDeferral.untilDate.toISOString() : null;
            }
          }
          mappedItems.push(dto);
        }
        res.json({
          success: true,
          data: { items: mappedItems, total: result.total, source: result.source },
          requestId: req.id,
        });
      } catch (e) {
        next(e);
      }
    },

    async vectorSearch(req, res, next) {
      try {
        const parsed = VectorSearchBody.safeParse(req.body);
        if (!parsed.success)
          throw new ValidationError('Invalid vector search body', parsed.error.issues);
        const { embedding, bloodGroup, eligibilityStatus, limit } = parsed.data;
        const items = await searchDonorsByVector(embedding, {
          bloodGroup,
          eligibilityStatus,
          limit,
        });
        const mappedItems = (items || []).map((item) => toDto(item));
        res.json({ success: true, data: { items: mappedItems, total: items.length }, requestId: req.id });
      } catch (e) {
        next(e);
      }
    },
  };
}
