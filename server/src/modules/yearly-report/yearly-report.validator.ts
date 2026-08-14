import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const CURRENT_YEAR = new Date().getFullYear();

export const YearlyReportQuery = z.object({
  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(CURRENT_YEAR + 1),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

export const ValidateYearlyReport = {
  query: (req: Request) => parseOrThrow(YearlyReportQuery, req.query, 'query string'),
};
