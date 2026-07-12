import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { COMPONENT_TYPE } from '@/shared/enums';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

const BulkTransferItem = z.object({
  componentType: z.enum(COMPONENT_TYPE),
  bloodGroup: z.string().trim().min(1),
  bagNo: z.string().trim().min(1),
  segmentNo: z.string().trim().optional(),
  volumeMl: z.coerce.number().positive().optional(),
  collectedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  unitId: z.string().regex(OBJECT_ID).optional(),
});

export const CreateBulkTransferBody = z.object({
  transferType: z.enum(['GIVE_LOAN', 'TAKE_LOAN']),
  bloodBankName: z.string().trim().min(1).max(200),
  bloodBankAddress: z.string().trim().min(1).max(500),
  transferDate: z.coerce.date(),
  items: z.array(BulkTransferItem).min(1),
  notes: z.string().trim().max(2000).optional(),
});

export const ListBulkTransferQuery = z.object({
  transferType: z.preprocess((v) => (v === '' ? undefined : v), z.enum(['GIVE_LOAN', 'TAKE_LOAN']).optional()),
  search: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  page: z.coerce.number().int().min(1).default(1),
  // Capped at 5000 (not the usual 200) so the "All Records" Excel export can
  // fetch the full register in one page, matching every other export flow.
  limit: z.coerce.number().int().min(1).max(5000).default(20),
  fromDate: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.date().optional()),
  toDate: z.preprocess((v) => (v === '' ? undefined : v), z.coerce.date().optional()),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type CreateBulkTransferInput = z.infer<typeof CreateBulkTransferBody>;
export type ListBulkTransferInput = z.infer<typeof ListBulkTransferQuery>;

export const ValidateBulkTransfer = {
  createBody: (req: Request) => parseOrThrow(CreateBulkTransferBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListBulkTransferQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
