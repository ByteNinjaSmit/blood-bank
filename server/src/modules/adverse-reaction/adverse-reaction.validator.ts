import { z } from 'zod';
import type { Request } from 'express';
import { ADVERSE_REACTION_CATEGORY, ADVERSE_REACTION_SEVERITY } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const ReportReactionBody = z.object({
  transfusionId: z.string().regex(OBJECT_ID),
  unitId: z.string().trim().min(1).max(120),
  patientId: z.string().regex(OBJECT_ID),
  category: z.enum(ADVERSE_REACTION_CATEGORY),
  severity: z.enum(ADVERSE_REACTION_SEVERITY),
  onsetMinutesAfterStart: z.coerce.number().int().min(0).optional(),
  signsSymptoms: z.array(z.string().max(120)).optional(),
  investigationsDone: z.array(z.string().max(120)).optional(),
  managementGiven: z.string().max(500).optional(),
  outcome: z.string().max(300).optional(),
  notifyEmail: z.string().email().optional(),
});

export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateAdverseReaction = {
  reportBody: (req: Request) => parseOrThrow(ReportReactionBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListQuery, req.query, 'query string'),
};
