import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const IssueUnitBody = z.object({
  requisitionId: z.string().regex(OBJECT_ID),
  unitId: z.string().trim().min(1).max(120),
  collectedByName: z.string().trim().max(200).optional(),
  transportTempCelsius: z.coerce.number().min(-30).max(40).optional(),
  // Presence of override.reason triggers the MO-override path. The
  // route restricts who may send it (medical-officer / bbo).
  override: z.object({ reason: z.string().trim().min(1).max(300) }).optional(),
  // Operator-editable issue time from the Issue modal (12h picker), defaults
  // to system time when omitted.
  issuedAt: z.coerce.date().optional(),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateIssue = {
  issueBody: (req: Request) => parseOrThrow(IssueUnitBody, req.body, 'request body'),
};
