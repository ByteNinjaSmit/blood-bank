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
  performedAt: z.string().trim().optional(),
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
  // Single test date/time applied to every item in the batch.
  performedAt: z.string().trim().optional(),
});

const BatchDraftBody = z.object({
  donationIds: z.array(z.string().trim().min(1)).min(1).max(500),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) {
    // Surface exactly which field failed and why — a bare "Invalid request
    // body" (e.g. on an empty items:[] batch) gives no hint what actually
    // went wrong without reproducing it. See donation.validator.ts's
    // parseOrThrow for the same pattern.
    const first = r.error.issues[0];
    const detail = first ? ` — ${first.path.join('.') || '(root)'}: ${first.message}` : '';
    throw new ValidationError(`Invalid ${where}${detail}`, r.error.issues);
  }
  return r.data;
}

export const ValidateTtiLegacyView = {
  bagListQuery: (req: Request) => parseOrThrow(BagListQuery, req.query, 'query string'),
  resultListQuery: (req: Request) => parseOrThrow(ResultListQuery, req.query, 'query string'),
  resultIdParam: (req: Request) => parseOrThrow(ResultIdParam, req.params, 'path params'),
  recordResultsBody: (req: Request) => parseOrThrow(RecordResultsBody, req.body, 'request body'),
  recordResultsBatchBody: (req: Request) =>
    parseOrThrow(RecordResultsBatchBody, req.body, 'request body'),
  batchDraftBody: (req: Request) => parseOrThrow(BatchDraftBody, req.body, 'request body'),
};
