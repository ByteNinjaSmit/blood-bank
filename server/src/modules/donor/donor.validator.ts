import { z } from 'zod';
import { ABO_GROUP, RH_FACTOR, DONOR_LAST_DONATION_PLACE } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';
import type { Request } from 'express';

const PHONE = /^\d{10}$/;
const UID = /^\d{12}$/;
const PINCODE = /^\d{6}$/;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Empty (or whitespace-only) strings from HTML forms become undefined so
// .optional() works as expected without each field needing
// .or(z.literal('')) — trimming first means a stray space left over
// from older data/autofill doesn't fail a regex check below.
const blankToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => {
    const t = typeof v === 'string' ? v.trim() : v;
    return t === '' || t === null ? undefined : t;
  }, schema);

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
  lastDonationPlace: blankToUndef(z.enum(DONOR_LAST_DONATION_PLACE).optional()),
  emergencyDonationWillingness: blankToUndef(z.enum(['Yes', 'No']).optional()),
});
export type CreateDonorInput = z.infer<typeof CreateDonorBody>;

export const UpdateDonorBody = CreateDonorBody.partial().extend({
  editReason: blankToUndef(z.string().trim().max(500).optional()),
});
export type UpdateDonorInput = z.infer<typeof UpdateDonorBody>;

export const ListDonorsQuery = z.object({
  search: z.string().trim().max(120).optional(),
  bloodGroup: z.enum(ABO_GROUP).optional(),
  rh: z.enum(['Positive', 'Negative']).optional(),
  city: z.string().trim().max(80).optional(),
  source: z.enum(['inhouse', 'camp']).optional(),
  // 'recently-donated' is a derived status (eligible but still inside the
  // 90/120-day interval); resolved in the repository, not a stored value.
  eligibilityStatus: z.enum(['eligible', 'deferred', 'temp-deferred', 'recently-donated']).optional(),
  campId: z.string().regex(OBJECT_ID, 'Invalid camp id').optional(),
  from: blankToUndef(z.coerce.date().optional()),
  to: blankToUndef(z.coerce.date().optional()),
  // Recycle Bin uses deletedOnly=true to list soft-deleted donors; Master
  // Register never sets it, so soft-deleted donors stay hidden there.
  deletedOnly: z.coerce.boolean().optional().default(false),
  sortBy: z.enum(['createdAt', 'lastDonationDate', 'name', 'dob']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(10000).default(25),
});
export type ListDonorsInput = z.infer<typeof ListDonorsQuery>;

export const DonorIdParam = z.object({
  id: z.string().regex(OBJECT_ID, 'Invalid donor id'),
});
export type DonorIdInput = z.infer<typeof DonorIdParam>;

export const DeleteReasonBody = z.object({
  reason: z.string().trim().min(1, 'A reason is required for this action').max(500),
});
export type DeleteReasonInput = z.infer<typeof DeleteReasonBody>;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    // Surface exactly which field failed and why — a bare "Invalid
    // request body" gives neither the caller nor the server log enough
    // to diagnose a rejected edit/create without reproducing it.
    const first = result.error.issues[0];
    const detail = first ? ` — ${first.path.join('.') || '(root)'}: ${first.message}` : '';
    throw new ValidationError(`Invalid ${where}${detail}`, result.error.issues);
  }
  return result.data;
}

export const Validate = {
  createBody: (req: Request) => parseOrThrow(CreateDonorBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateDonorBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListDonorsQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(DonorIdParam, req.params, 'path params'),
  deleteReasonBody: (req: Request) => parseOrThrow(DeleteReasonBody, req.body ?? {}, 'request body'),
};

// Used internally by tests; not exported through Validate.
export const RH_TO_NEW: Record<'Positive' | 'Negative', (typeof RH_FACTOR)[number]> = {
  Positive: 'POSITIVE',
  Negative: 'NEGATIVE',
};
