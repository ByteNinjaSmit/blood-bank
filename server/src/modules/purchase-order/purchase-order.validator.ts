import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { BAG_TYPE, BAG_CAPACITY_ML, ANTICOAGULANT, PO_STATUS } from '@/shared/enums';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

const LineItemSchema = z.object({
  bagType: z.enum(BAG_TYPE),
  capacityMl: z.number().refine((v) => (BAG_CAPACITY_ML as readonly number[]).includes(v), 'Invalid capacity'),
  anticoagulant: z.enum(ANTICOAGULANT),
  productCode: z.string().trim().max(100).optional(),
  quantityOrdered: z.number().int().positive(),
});

export const CreatePOBody = z.object({
  poDate: z.coerce.date(),
  vendorId: z.string().regex(OBJECT_ID, 'Invalid vendorId'),
  lineItems: z.array(LineItemSchema).min(1, 'At least one line item required'),
  expectedDelivery: z.coerce.date().optional(),
  manufacturer: z.string().trim().max(200).optional(),
  billDate: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const UpdatePOBody = z.object({
  lineItems: z.array(LineItemSchema).min(1).optional(),
  expectedDelivery: z.coerce.date().optional(),
  manufacturer: z.string().trim().max(200).optional(),
  billDate: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const ListPOQuery = z.object({
  vendorId: z.string().regex(OBJECT_ID).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type CreatePOInput = z.infer<typeof CreatePOBody>;
export type UpdatePOInput = z.infer<typeof UpdatePOBody>;
export type ListPOInput = z.infer<typeof ListPOQuery>;

export const ValidatePO = {
  createBody: (req: Request) => parseOrThrow(CreatePOBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdatePOBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListPOQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
