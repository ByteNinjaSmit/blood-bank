import { z } from 'zod';
import type { Request } from 'express';
import { DEFERRAL_TYPE } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const CreateDeferralBody = z
  .object({
    donor: z.string().regex(OBJECT_ID),
    type: z.enum(DEFERRAL_TYPE),
    reason: z.string().trim().min(1).max(300),
    untilDate: z.coerce.date().optional(),
    source: z
      .enum(['QUESTIONNAIRE', 'VITALS', 'TTI_REACTIVE', 'LOOKBACK', 'MANUAL'])
      .default('MANUAL'),
    relatedDonationId: z.string().trim().max(80).optional(),
  })
  .refine((d) => d.type === 'PERMANENT' || d.untilDate !== undefined, {
    message: 'Temporary deferral requires untilDate',
    path: ['untilDate'],
  });

export const DonorIdParam = z.object({
  donorId: z.string().regex(OBJECT_ID, 'Invalid donor id'),
});

export const DeferralIdParam = z.object({
  id: z.string().regex(OBJECT_ID, 'Invalid deferral id'),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateDeferral = {
  createBody: (req: Request) => parseOrThrow(CreateDeferralBody, req.body, 'request body'),
  donorIdParam: (req: Request) => parseOrThrow(DonorIdParam, req.params, 'path params'),
  idParam: (req: Request) => parseOrThrow(DeferralIdParam, req.params, 'path params'),
};
