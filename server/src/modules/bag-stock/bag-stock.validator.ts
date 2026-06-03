import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { BAG_TYPE, BAG_STOCK_STATUS } from '@/shared/enums';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

export const ListBagStockQuery = z.object({
  bagType: z.enum(BAG_TYPE).optional(),
  status: z.enum(BAG_STOCK_STATUS).optional(),
  expiryBefore: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const UpdateBagStockStatusBody = z.object({
  status: z.enum(BAG_STOCK_STATUS),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type ListBagStockInput = z.infer<typeof ListBagStockQuery>;
export type UpdateBagStockStatusInput = z.infer<typeof UpdateBagStockStatusBody>;

export const ValidateBagStock = {
  listQuery: (req: Request) => parseOrThrow(ListBagStockQuery, req.query, 'query string'),
  updateStatusBody: (req: Request) => parseOrThrow(UpdateBagStockStatusBody, req.body, 'request body'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
