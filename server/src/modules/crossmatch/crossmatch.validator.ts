import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const PerformCrossmatchBody = z.object({
  requisitionId: z.string().regex(OBJECT_ID),
  unitId: z.string().trim().min(1).max(120),
  method: z.enum(['IS', 'AHG', 'ELECTRONIC']),
  phases: z
    .object({
      immediateSpin: z.enum(['COMPATIBLE', 'INCOMPATIBLE', 'NA']).optional(),
      coombsAhg: z.enum(['COMPATIBLE', 'INCOMPATIBLE', 'NA']).optional(),
    })
    .optional(),
  result: z.enum(['COMPATIBLE', 'INCOMPATIBLE']),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateCrossmatch = {
  performBody: (req: Request) => parseOrThrow(PerformCrossmatchBody, req.body, 'request body'),
};
