import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { BAG_DISCARD_REASON } from '@/shared/enums';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

export const CreateBagDiscardBody = z.object({
  discardDate: z.coerce.date(),
  stockId: z.string().regex(OBJECT_ID, 'Invalid stockId'),
  quantity: z.number().int().positive(),
  reason: z.enum(BAG_DISCARD_REASON),
  reasonDetail: z.string().trim().max(2000).optional(),
});

export const ApproveBagDiscardBody = z.object({
  disposalMethod: z.string().trim().max(200).optional(),
  biomedicalWasteManifestNo: z.string().trim().max(100).optional(),
  disposalDate: z.coerce.date().optional(),
});

export const ListBagDiscardQuery = z.object({
  stockId: z.string().regex(OBJECT_ID).optional(),
  reason: z.enum(BAG_DISCARD_REASON).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type CreateBagDiscardInput = z.infer<typeof CreateBagDiscardBody>;
export type ApproveBagDiscardInput = z.infer<typeof ApproveBagDiscardBody>;
export type ListBagDiscardInput = z.infer<typeof ListBagDiscardQuery>;

export const ValidateBagDiscard = {
  createBody: (req: Request) => parseOrThrow(CreateBagDiscardBody, req.body, 'request body'),
  approveBody: (req: Request) => parseOrThrow(ApproveBagDiscardBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListBagDiscardQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
