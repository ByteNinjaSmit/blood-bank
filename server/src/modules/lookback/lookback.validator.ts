import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const RunLookbackBody = z
  .object({
    donationId: z.string().trim().max(80).optional(),
    donorId: z.string().regex(OBJECT_ID).optional(),
    notifyEmail: z.string().email().optional(),
  })
  .refine((d) => d.donationId || d.donorId, {
    message: 'Provide donationId or donorId',
    path: ['donationId'],
  });

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateLookback = {
  runBody: (req: Request) => parseOrThrow(RunLookbackBody, req.body, 'request body'),
};
