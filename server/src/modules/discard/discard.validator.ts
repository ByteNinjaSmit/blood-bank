import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const ListQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  search: z.string().trim().max(120).optional(),
  itemType: z.string().trim().optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const CreateBody = z.object({
  bagNo: z.string().trim().min(1, 'Bag number (bagNo) is required.'),
  batchNo: z.string().trim().optional(),
  segmentNo: z.string().trim().optional(),
  reason: z.string().trim().min(1, 'Discard reason is required.'),
  description: z.string().trim().optional(),
  ttiResults: z.record(z.string(), z.string()).optional(),
});

const UnitIdParam = z.object({
  unitId: z.string().trim().min(1, 'unitId is required'),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateDiscard = {
  listQuery: (req: Request) => parseOrThrow(ListQuery, req.query, 'query string'),
  createBody: (req: Request) => parseOrThrow(CreateBody, req.body, 'request body'),
  unitIdParam: (req: Request) => parseOrThrow(UnitIdParam, req.params, 'path params'),
};
