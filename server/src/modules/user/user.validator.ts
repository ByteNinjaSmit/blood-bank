import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const blank = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), s);

// One row of the admin panel's permission grid. Module-wide grants omit
// pageId; page-scoped overrides (from the new module→page Permissions
// editor) set it to one of client/src/config/access-registry's page ids —
// the backend doesn't validate that pageId against anything (it's opaque,
// frontend-only metadata), just that it's a reasonable string when present.
const PermissionEntry = z.object({
  moduleName: z.string().trim().min(1).max(80),
  pageId: blank(z.string().trim().max(80).optional()),
  view: z.boolean().optional(),
  create: z.boolean().optional(),
  update: z.boolean().optional(),
  delete: z.boolean().optional(),
});

export const CreateUserBody = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().email(),
  phone: blank(
    z
      .string()
      .regex(/^\d{10}$/)
      .optional(),
  ),
  // Free-text display label — no authorization meaning. See
  // server/src/shared/role-map.ts and User.isFullAccess.
  role: z.string().trim().min(1).max(80),
  roleId: blank(z.string().regex(OBJECT_ID).optional()),
  isFullAccess: z.boolean().optional(),
  password: z.string().min(8),
  permissions: z.array(PermissionEntry).optional(),
  campId: blank(z.string().regex(OBJECT_ID).optional()),
});

export const UpdateUserBody = z.object({
  firstName: blank(z.string().trim().min(1).max(80).optional()),
  lastName: blank(z.string().trim().min(1).max(80).optional()),
  email: blank(z.string().email().optional()),
  phone: blank(
    z
      .string()
      .regex(/^\d{10}$/)
      .optional(),
  ),
  role: blank(z.string().trim().min(1).max(80).optional()),
  roleId: blank(z.string().regex(OBJECT_ID).optional()),
  isFullAccess: z.boolean().optional(),
  password: blank(z.string().min(8).optional()),
  permissions: z.array(PermissionEntry).optional(),
  campId: blank(z.string().regex(OBJECT_ID).optional()),
  status: z.enum(['active', 'inactive', 'pending', 'blocked', 'rejected']).optional(),
});

export const ListUsersQuery = z.object({
  role: blank(z.string().trim().max(80).optional()),
  status: z.string().optional(),
  campId: blank(z.string().regex(OBJECT_ID).optional()),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(1000),
});

export const IdParam = z.object({ id: z.string().min(1).max(80) });

export const DeactivateUserBody = z.object({
  reason: blank(z.string().trim().max(500).optional()),
});

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateUser = {
  createBody: (req: Request) => parseOrThrow(CreateUserBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateUserBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListUsersQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
  deactivateBody: (req: Request) => parseOrThrow(DeactivateUserBody, req.body ?? {}, 'request body'),
};
