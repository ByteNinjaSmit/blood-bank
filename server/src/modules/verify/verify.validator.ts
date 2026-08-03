import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

export const UnitIdParam = z.object({
  unitId: z.string().trim().min(1).max(64),
});

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateVerify = {
  unitIdParam: (req: Request) => parseOrThrow(UnitIdParam, req.params, 'path params'),
};
