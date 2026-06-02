import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const blank = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), s);

export const CreateSiteBody = z.object({
  siteId: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  address: z.string().trim().min(1).max(500),
  phone: z.string().trim().min(6).max(20),
  email: z.string().email(),
  staff: z.array(z.string().regex(OBJECT_ID)).min(1, 'Staff list cannot be empty'),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
});

export const UpdateSiteBody = z.object({
  name: blank(z.string().trim().min(1).max(200).optional()),
  description: blank(z.string().trim().max(2000).optional()),
  address: blank(z.string().trim().min(1).max(500).optional()),
  phone: blank(z.string().trim().min(6).max(20).optional()),
  email: blank(z.string().email().optional()),
  staff: z.array(z.string().regex(OBJECT_ID)).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const VoluntaryQuery = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.string().trim().max(40).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  siteId: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(10),
  sortBy: z.string().trim().max(40).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid site id') });
export const SiteIdParam = z.object({ siteId: z.string().regex(OBJECT_ID, 'Invalid site id') });

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateSite = {
  createBody: (req: Request) => parseOrThrow(CreateSiteBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateSiteBody, req.body, 'request body'),
  voluntaryQuery: (req: Request) => parseOrThrow(VoluntaryQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
  siteIdParam: (req: Request) => parseOrThrow(SiteIdParam, req.params, 'path params'),
};
