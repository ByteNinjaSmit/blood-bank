import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const BagListQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  search: z.string().trim().max(120).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
});

const ResultListQuery = BagListQuery.extend({
  status: z.string().trim().optional(),
});

const ResultIdParam = z.object({
  id: z.string().trim().min(1).max(80),
});

const RecordResultsBody = z.object({
  testResults: z
    .array(
      z.object({
        test: z.string().trim().min(1),
        result: z.string().trim().min(1),
      }),
    )
    .min(1),
  technicianId: z.string().trim().optional(),
  editReason: z.string().trim().max(500).optional(),
});

const BatchResultItem = z.object({
  id: z.string().trim().min(1).max(80),
  testResults: z
    .array(
      z.object({
        test: z.string().trim().min(1),
        result: z.string().trim().min(1),
      }),
    )
    .min(1),
});

const RecordResultsBatchBody = z.object({
  items: z.array(BatchResultItem).min(1).max(500),
  technicianId: z.string().trim().optional(),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateTtiLegacyView = {
  bagListQuery: (req: Request) => parseOrThrow(BagListQuery, req.query, 'query string'),
  resultListQuery: (req: Request) => parseOrThrow(ResultListQuery, req.query, 'query string'),
  resultIdParam: (req: Request) => parseOrThrow(ResultIdParam, req.params, 'path params'),
  recordResultsBody: (req: Request) => parseOrThrow(RecordResultsBody, req.body, 'request body'),
  recordResultsBatchBody: (req: Request) =>
    parseOrThrow(RecordResultsBatchBody, req.body, 'request body'),
};
