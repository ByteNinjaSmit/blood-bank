import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const PHONE = /^[+]?[\d\s\-()]{10,15}$/;
const blank = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), s);

export const CreateHospitalBody = z.object({
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(500),
  contactPerson: z.string().trim().min(1).max(200),
  phone: z.string().regex(PHONE, 'Valid phone number required'),
  email: blank(z.string().email().optional()),
  licenseNo: blank(z.string().trim().max(120).optional()),
});

export const UpdateHospitalBody = z.object({
  name: blank(z.string().trim().min(1).max(200).optional()),
  address: blank(z.string().trim().min(1).max(500).optional()),
  contactPerson: blank(z.string().trim().min(1).max(200).optional()),
  phone: blank(z.string().regex(PHONE).optional()),
  email: blank(z.string().email().optional()),
  licenseNo: blank(z.string().trim().max(120).optional()),
});

export const ListHospitalsQuery = z.object({
  name: z.string().trim().max(200).optional(),
  contactPerson: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(20).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
  sortBy: z.enum(['name', 'contactPerson', 'phone', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid hospital id') });

function parseOrThrow<T>(s: z.ZodType<T>, v: unknown, where: string): T {
  const r = s.safeParse(v);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateHospital = {
  createBody: (req: Request) => parseOrThrow(CreateHospitalBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateHospitalBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListHospitalsQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
