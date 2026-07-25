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

const StorageTransferItem = z.object({
  unitId: z.string().regex(OBJECT_ID),
  bagNo: z.string().trim().min(1),
  componentType: z.enum(COMPONENT_TYPE),
  bloodGroup: z.string().trim().min(1),
  rhFactor: z.string().trim().optional(),
  segmentNo: z.string().trim().optional(),
  volumeMl: z.coerce.number().positive().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const CreateStorageTransferBody = z.object({
  location: z.string().trim().min(1),
  otherLocationName: z.string().trim().optional(),
  sentDate: z.coerce.date(),
  items: z.array(StorageTransferItem).min(1, 'At least one blood bag is required'),
});

export const UpdateStorageTransferBody = z.object({
  location: z.string().trim().min(1).optional(),
  otherLocationName: z.string().trim().optional(),
  sentDate: z.coerce.date().optional(),
  items: z.array(StorageTransferItem).min(1).optional(),
});

export const DeleteReasonBody = z.object({
  reason: z.string().trim().min(1, 'A reason is required for this action').max(500),
});

export const ListStorageTransferQuery = z.object({
  search: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  location: z.preprocess((v) => (v === '' ? undefined : v), z.string().optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(5000).default(20),
  deletedOnly: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type CreateStorageTransferInput = z.infer<typeof CreateStorageTransferBody>;
export type UpdateStorageTransferInput = z.infer<typeof UpdateStorageTransferBody>;
export type ListStorageTransferInput = z.infer<typeof ListStorageTransferQuery>;

export const ValidateStorageTransfer = {
  createBody: (req: Request) => parseOrThrow(CreateStorageTransferBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateStorageTransferBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListStorageTransferQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
  deleteReasonBody: (req: Request) => parseOrThrow(DeleteReasonBody, req.body ?? {}, 'request body'),
};
