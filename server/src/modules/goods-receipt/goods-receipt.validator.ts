import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { BAG_TYPE, ANTICOAGULANT, GRN_STATUS } from '@/shared/enums';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

const BatchLineSchema = z.object({
  bagType: z.enum(BAG_TYPE),
  capacityMl: z.number().positive(),
  anticoagulant: z.enum(ANTICOAGULANT).optional(),
  batchNumber: z.string().trim().min(1).max(100),
  manufacturingDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date(),
  quantityReceived: z.number().int().positive(),
  quantityAccepted: z.number().int().min(0).optional(),
  quantityRejected: z.number().int().min(0).optional(),
});

const FinancialsSchema = z.object({
  basicAmountRs: z.number().min(0).optional(),
  cgstRs: z.number().min(0).optional(),
  sgstRs: z.number().min(0).optional(),
  igstRs: z.number().min(0).optional(),
  discountRs: z.number().min(0).optional(),
  netAmountRs: z.number().min(0).optional(),
}).optional();

export const CreateGRNBody = z.object({
  poId: z.string().regex(OBJECT_ID, 'Invalid poId'),
  vendorName: z.string().trim().min(1).optional(),
  billNo: z.string().trim().min(1).max(100),
  billDate: z.coerce.date(),
  transportDetails: z.string().trim().max(500).optional(),
  receivedDate: z.coerce.date(),
  receivedById: z.string().regex(OBJECT_ID, 'Invalid receivedById'),
  batchLines: z.array(BatchLineSchema).min(1, 'At least one batch line required'),
  financials: FinancialsSchema,
  notes: z.string().trim().max(2000).optional(),
});

export const ListGRNQuery = z.object({
  poId: z.string().regex(OBJECT_ID).optional(),
  vendorName: z.string().optional(),
  status: z.enum(GRN_STATUS).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type CreateGRNInput = z.infer<typeof CreateGRNBody>;
export type ListGRNInput = z.infer<typeof ListGRNQuery>;

export const ValidateGRN = {
  createBody: (req: Request) => parseOrThrow(CreateGRNBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListGRNQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
