import { z } from 'zod';
import type { Request } from 'express';
import { TRANSFUSION_OUTCOME } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const Vitals = z.object({
  at: z.coerce.date(),
  temperatureCelsius: z.coerce.number().optional(),
  pulseBpm: z.coerce.number().int().optional(),
  bloodPressure: z.string().optional(),
  respiratoryRate: z.coerce.number().int().optional(),
  notes: z.string().max(300).optional(),
});

export const RecordTransfusionBody = z.object({
  issueId: z.string().regex(OBJECT_ID),
  unitId: z.string().trim().min(1).max(120),
  patientId: z.string().regex(OBJECT_ID),
  bedsideCheck: z.object({
    checkedById: z.string().regex(OBJECT_ID),
    witnessedById: z.string().regex(OBJECT_ID),
    patientIdConfirmed: z.boolean(),
    unitIdConfirmed: z.boolean(),
    compatibilityConfirmed: z.boolean(),
  }),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
  vitalsLog: z.array(Vitals).optional(),
  outcome: z.enum(TRANSFUSION_OUTCOME),
  hadReaction: z.boolean().default(false),
});

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateTransfusion = {
  recordBody: (req: Request) => parseOrThrow(RecordTransfusionBody, req.body, 'request body'),
};
