import { z } from 'zod';
import type { Request } from 'express';
import { ROLE } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const blank = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), s);

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
  role: z.enum(ROLE),
  password: z.string().min(8),
  permissions: z.array(z.unknown()).optional(),
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
  role: z.enum(ROLE).optional(),
  password: blank(z.string().min(8).optional()),
  permissions: z.array(z.unknown()).optional(),
  campId: blank(z.string().regex(OBJECT_ID).optional()),
  status: z.enum(['active', 'inactive', 'pending', 'blocked', 'rejected']).optional(),
});

export const ListUsersQuery = z.object({
  role: z.enum(ROLE).optional(),
  status: z.string().optional(),
  campId: blank(z.string().regex(OBJECT_ID).optional()),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(1000),
});

export const IdParam = z.object({ id: z.string().min(1).max(80) });

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
};
