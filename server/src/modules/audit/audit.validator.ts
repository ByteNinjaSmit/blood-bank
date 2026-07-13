import { z } from 'zod';
import type { Request } from 'express';
import { AUDIT_ACTION, ROLE } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const empty = (val: unknown) => (val === '' ? undefined : val);

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const EntityTrailParams = z.object({
  entityType: z.string().trim().min(1),
  entityId: z.string().trim().min(1),
});

export const AuditSearchQuery = z.object({
  module: z.preprocess(empty, z.string().trim().optional()),
  entityType: z.preprocess(empty, z.string().trim().optional()),
  entityId: z.preprocess(empty, z.string().trim().optional()),
  actor: z.preprocess(empty, z.string().regex(OBJECT_ID).optional()),
  action: z.preprocess(empty, z.enum(AUDIT_ACTION).optional()),
  role: z.preprocess(empty, z.enum(ROLE).optional()),
  severity: z.preprocess(empty, z.enum(['info', 'warning', 'critical']).optional()),
  dateFrom: z.preprocess(empty, z.coerce.date().optional()),
  dateTo: z.preprocess(empty, z.coerce.date().optional()),
  q: z.preprocess(empty, z.string().trim().max(200).optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(25),
});

export const AuditExportQuery = AuditSearchQuery.omit({ page: true, limit: true }).extend({
  limit: z.coerce.number().int().min(1).max(10_000).default(10_000),
});

export const ValidateAudit = {
  entityTrailParams: (req: Request) => parseOrThrow(EntityTrailParams, req.params, 'path params'),
  searchQuery: (req: Request) => parseOrThrow(AuditSearchQuery, req.query, 'query string'),
  exportQuery: (req: Request) => parseOrThrow(AuditExportQuery, req.query, 'query string'),
};
