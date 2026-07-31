import { z } from 'zod';
import type { Request } from 'express';
import { NOTIFICATION_SEVERITY, NOTIFICATION_MODULE } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
  read: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  severity: z.enum(NOTIFICATION_SEVERITY).optional(),
  module: z.enum(NOTIFICATION_MODULE).optional(),
});

export const IdParam = z.object({
  id: z.string().regex(OBJECT_ID),
});

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateNotification = {
  listQuery: (req: Request) => parseOrThrow(ListQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'route params'),
};
