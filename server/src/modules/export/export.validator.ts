import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const alignment = z.enum(['left', 'center', 'right']);
const cell = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const row = z.array(cell);

const subTable = z.object({
  subtitle: z.string(),
  headers: z.array(z.string()),
  rows: z.array(row),
  alignments: z.array(alignment).optional(),
});

const stat = z.object({ label: z.string(), value: z.coerce.number() });

const sheet = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  reportPeriod: z.string().optional(),
  reportType: z.string().optional(),
  filtersApplied: z.string().optional(),
  stats: z.array(stat).optional(),
  headers: z.array(z.string()).optional(),
  rows: z.array(row).optional(),
  alignments: z.array(alignment).optional(),
  tables: z.array(subTable).optional(),
});

export const ExportExcelBody = z.object({
  filename: z.string().trim().max(120).optional(),
  sheets: z.array(sheet).min(1, 'At least one sheet is required'),
});

export type ExportExcelBodyDto = z.infer<typeof ExportExcelBody>;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateExport = {
  excelBody: (req: Request) => parseOrThrow(ExportExcelBody, req.body, 'request body'),
};
