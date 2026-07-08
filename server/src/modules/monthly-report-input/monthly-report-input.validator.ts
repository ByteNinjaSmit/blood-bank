import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

export const UpsertMonthlyReportInputBody = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  donorCounsellingCount: z.coerce.number().int().min(0).default(0),
  ictcReferral: z
    .object({
      hiv: z.coerce.number().int().min(0).default(0),
      hbsag: z.coerce.number().int().min(0).default(0),
      hcv: z.coerce.number().int().min(0).default(0),
      vdrl: z.coerce.number().int().min(0).default(0),
      malaria: z.coerce.number().int().min(0).default(0),
    })
    .default({ hiv: 0, hbsag: 0, hcv: 0, vdrl: 0, malaria: 0 }),
});

export const MonthlyReportInputPeriodQuery = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateMonthlyReportInput = {
  upsertBody: (req: Request) => parseOrThrow(UpsertMonthlyReportInputBody, req.body, 'request body'),
  periodQuery: (req: Request) => parseOrThrow(MonthlyReportInputPeriodQuery, req.query, 'query string'),
};
