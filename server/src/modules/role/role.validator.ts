import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const blank = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), s);

// Mirrors user.validator.ts's PermissionEntry exactly — same flat grid shape.
const PermissionEntry = z.object({
  moduleName: z.string().trim().min(1).max(80),
  pageId: blank(z.string().trim().max(80).optional()),
  view: z.boolean().optional(),
  create: z.boolean().optional(),
  update: z.boolean().optional(),
  delete: z.boolean().optional(),
});

export const CreateRoleBody = z.object({
  name: z.string().trim().min(1).max(80),
  description: blank(z.string().trim().max(300).optional()),
  isFullAccess: z.boolean().optional(),
  permissions: z.array(PermissionEntry).optional(),
});

export const UpdateRoleBody = z.object({
  name: blank(z.string().trim().min(1).max(80).optional()),
  description: blank(z.string().trim().max(300).optional()),
  isFullAccess: z.boolean().optional(),
  permissions: z.array(PermissionEntry).optional(),
});

export const ListRolesQuery = z.object({
  search: blank(z.string().trim().max(120).optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(1000),
});

export const IdParam = z.object({ id: z.string().min(1).max(80) });

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateRole = {
  createBody: (req: Request) => parseOrThrow(CreateRoleBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateRoleBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListRolesQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
