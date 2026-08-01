import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { VENDOR_STATUS } from '@/shared/enums';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

export const CreateVendorBody = z.object({
  name: z.string().trim().min(1).max(200),
  manufacturer: z.string().trim().min(1).max(200),
  drugLicenseNo: z.string().trim().min(1).max(100),
  gstNo: z.string().trim().min(1).max(20),
  address: z.string().trim().min(1).max(500),
  contactPerson: z.string().trim().min(1).max(200),
  contactPhone: z.string().trim().min(6).max(20),
  email: z.string().email().optional(),
  contractStart: z.coerce.date().optional(),
  contractEnd: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const UpdateVendorBody = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  manufacturer: z.string().trim().min(1).max(200).optional(),
  contactPerson: z.string().trim().min(1).max(200).optional(),
  contactPhone: z.string().trim().min(6).max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().trim().min(1).max(500).optional(),
  gstNo: z.string().trim().min(1).max(20).optional(),
  contractStart: z.coerce.date().optional(),
  contractEnd: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const UpdateVendorStatusBody = z.object({
  approvalStatus: z.enum(VENDOR_STATUS),
});

export const ListVendorsQuery = z.object({
  approvalStatus: z.enum(VENDOR_STATUS).optional(),
  search: z.string().trim().max(120).optional(),
  deletedOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export const DeleteReasonBody = z.object({
  reason: z.string().trim().min(1, 'A reason is required for this action').max(500),
});

export type CreateVendorInput = z.infer<typeof CreateVendorBody>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorBody>;
export type UpdateVendorStatusInput = z.infer<typeof UpdateVendorStatusBody>;
export type ListVendorsInput = z.infer<typeof ListVendorsQuery>;

export const ValidateVendor = {
  createBody: (req: Request) => parseOrThrow(CreateVendorBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateVendorBody, req.body, 'request body'),
  updateStatusBody: (req: Request) =>
    parseOrThrow(UpdateVendorStatusBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListVendorsQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
  deleteReasonBody: (req: Request) =>
    parseOrThrow(DeleteReasonBody, req.body ?? {}, 'request body'),
};
