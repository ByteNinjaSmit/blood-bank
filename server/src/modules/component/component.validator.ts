import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const ListQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  type: z.string().trim().optional(),
  status: z.string().trim().optional(),
  expiryBefore: z.string().trim().optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  search: z.string().trim().max(120).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  site: z.enum(['inhouse', 'camp']).optional(),
  campId: z.string().trim().optional(),
});

const NearExpiryQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  days: z.coerce.number().int().min(1).optional(),
  componentType: z.string().trim().optional(),
  status: z.string().trim().optional(),
  search: z.string().trim().max(120).optional(),
});

const SeparateBody = z.object({
  donationId: z.string().trim().min(1),
  componentType: z.string().trim().min(1),
  volumeMl: z.coerce.number().positive().optional(),
  rpmFirstSpin: z.string().trim().max(40).optional(),
  rpmSecondSpin: z.string().trim().max(40).optional(),
  separationTime: z.coerce.date().optional(),
});

const SeparationCompletedBody = z.object({
  donationId: z.string().trim().min(1),
  signature: z.string().trim().min(1),
});

const PatchBody = z.object({
  volumeMl: z.coerce.number().positive().optional(),
  storageLocation: z.string().trim().max(120).optional(),
  expiryDate: z.string().trim().optional(),
  editReason: z.string().trim().max(500).optional(),
});

const PatchBagBody = z.object({
  components: z
    .array(
      z.object({
        unitId: z.string().trim().min(1),
        componentType: z.string().trim().min(1),
        volumeMl: z.coerce.number().positive(),
        storageLocation: z.string().trim().max(120).optional(),
        expiryDate: z.coerce.date().optional(),
      }),
    )
    .min(1),
  rpmFirstSpin: z.string().trim().max(40).optional(),
  rpmSecondSpin: z.string().trim().max(40).optional(),
  separationTime: z.coerce.date().optional(),
  editReason: z.string().trim().min(1, 'A reason is required to edit this bag').max(500),
});

const BatchDraftBody = z.object({
  donationIds: z.array(z.string().trim().min(1)).min(1).max(200),
});

const IdParam = z.object({ id: z.string().trim().min(1).max(80) });

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateComponent = {
  listQuery: (req: Request) => parseOrThrow(ListQuery, req.query, 'query string'),
  nearExpiryQuery: (req: Request) => parseOrThrow(NearExpiryQuery, req.query, 'query string'),
  separateBody: (req: Request) => parseOrThrow(SeparateBody, req.body, 'request body'),
  separationCompletedBody: (req: Request) =>
    parseOrThrow(SeparationCompletedBody, req.body, 'request body'),
  patchBody: (req: Request) => parseOrThrow(PatchBody, req.body, 'request body'),
  patchBagBody: (req: Request) => parseOrThrow(PatchBagBody, req.body, 'request body'),
  batchDraftBody: (req: Request) => parseOrThrow(BatchDraftBody, req.body, 'request body'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
