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

const blank = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), s);

export const ListDeferralsQuery = z.object({
  search: blank(z.string().trim().max(200).optional()),
  type: blank(z.enum(DEFERRAL_TYPE).optional()),
  status: blank(z.enum(['active', 'lifted', 'all']).optional().default('active')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  sortBy: z.enum(['createdAt', 'untilDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
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
  listQuery: (req: Request) => parseOrThrow(ListDeferralsQuery, req.query, 'query string'),
};
