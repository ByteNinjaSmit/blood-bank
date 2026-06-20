import { z } from 'zod';
import { ABO_GROUP, RH_FACTOR } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';
import type { Request } from 'express';

const PHONE = /^\d{10}$/;
const UID = /^\d{12}$/;
const PINCODE = /^\d{6}$/;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Empty strings from HTML forms become undefined so .optional() works
// as expected without each field needing .or(z.literal('')).
const blankToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);

const NameSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().min(1, 'Middle name is required').max(80),
  lastName: z.string().trim().min(1).max(80),
});

const AddressSchema = z.object({
  line1: blankToUndef(z.string().trim().max(200).optional()),
  line2: blankToUndef(z.string().trim().max(200).optional()),
  city: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: blankToUndef(z.string().regex(PINCODE).optional()),
});

export const CreateDonorBody = z.object({
  donorId: blankToUndef(z.string().trim().min(1).max(80).optional()),
  name: NameSchema,
  uid: blankToUndef(z.string().regex(UID).optional()),
  dob: z.coerce.date(),
  sex: z.enum(['M', 'F', 'O']),
  phone: z.string().regex(PHONE),
  email: blankToUndef(z.string().email().optional()),
  address: AddressSchema,
  occupation: blankToUndef(z.string().trim().max(120).optional()),
  weightKg: z.coerce.number().positive().max(300),
  bloodGroup: z.enum(ABO_GROUP),
  rh: z.enum(['Positive', 'Negative']), // legacy enum for read-side; new code uses RH_FACTOR
  eligibilityStatus: blankToUndef(z.enum(['eligible', 'deferred', 'temp-deferred']).optional()),
  campId: blankToUndef(z.string().regex(OBJECT_ID, 'Invalid camp id').optional()),
  lastDonationDate: blankToUndef(z.coerce.date().optional()),
});
export type CreateDonorInput = z.infer<typeof CreateDonorBody>;

export const UpdateDonorBody = CreateDonorBody.partial();
export type UpdateDonorInput = z.infer<typeof UpdateDonorBody>;

export const ListDonorsQuery = z.object({
  search: z.string().trim().max(120).optional(),
  bloodGroup: z.enum(ABO_GROUP).optional(),
  rh: z.enum(['Positive', 'Negative']).optional(),
  city: z.string().trim().max(80).optional(),
  source: z.enum(['inhouse', 'camp']).optional(),
  eligibilityStatus: z.enum(['eligible', 'deferred', 'temp-deferred']).optional(),
  campId: z.string().regex(OBJECT_ID, 'Invalid camp id').optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});
export type ListDonorsInput = z.infer<typeof ListDonorsQuery>;

export const DonorIdParam = z.object({
  id: z.string().regex(OBJECT_ID, 'Invalid donor id'),
});
export type DonorIdInput = z.infer<typeof DonorIdParam>;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(`Invalid ${where}`, result.error.issues);
  }
  return result.data;
}

export const Validate = {
  createBody: (req: Request) => parseOrThrow(CreateDonorBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateDonorBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListDonorsQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(DonorIdParam, req.params, 'path params'),
};

// Used internally by tests; not exported through Validate.
export const RH_TO_NEW: Record<'Positive' | 'Negative', (typeof RH_FACTOR)[number]> = {
  Positive: 'POSITIVE',
  Negative: 'NEGATIVE',
};
