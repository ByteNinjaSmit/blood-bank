import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

export const DateRangeQuery = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export const ExecutiveQuery = z.object({
  period: z.enum(['7d', '30d', 'all']).default('30d'),
});

export type DateRangeInput = z.infer<typeof DateRangeQuery>;
export type ExecutiveInput = z.infer<typeof ExecutiveQuery>;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateMis = {
  dateRangeQuery: (req: Request) => parseOrThrow(DateRangeQuery, req.query, 'query string'),
  executiveQuery: (req: Request) => parseOrThrow(ExecutiveQuery, req.query, 'query string'),
};
