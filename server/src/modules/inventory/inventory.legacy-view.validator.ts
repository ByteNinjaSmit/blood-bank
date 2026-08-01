import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const StockListQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  status: z.string().trim().optional(),
  componentType: z.string().trim().optional(),
  siteId: z.string().trim().optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  storageLocation: z.string().trim().optional(),
  dispatchType: z.string().trim().optional(),
  bloodGroup: z.string().trim().optional(),
  rh: z.string().trim().optional(),
  expiryFrom: z.string().trim().optional(),
  expiryTo: z.string().trim().optional(),
  source: z.string().trim().optional(),
  // Distinguishes true stock reservations (Reserve Wizard) from units that
  // are merely RESERVED pending issue on a normal, already-approved
  // requisition — both share BloodUnit.status='RESERVED' otherwise.
  purpose: z.enum(['REQUISITION', 'RESERVATION']).optional(),
});

const UnreserveBody = z.object({
  inventoryIds: z.array(z.string().trim().min(1)).min(1, 'inventoryIds must be a non-empty array'),
  reason: z.string().trim().min(1, 'A reason is required for this action').max(500),
  userId: z.string().trim().optional(),
});

const SendToStorageBody = z.object({
  location: z.string().trim().optional(),
  otherLocationName: z.string().trim().optional(),
  bags: z
    .array(z.object({ bagIds: z.array(z.string().trim().min(1)).default([]) }))
    .min(1, 'bags must be a non-empty array'),
  userId: z.string().trim().optional(),
  sentDate: z.string().trim().nullable().optional(),
});

const UpdateStorageBody = z.object({
  location: z.string().trim().optional(),
  otherLocationName: z.string().trim().optional(),
  reason: z.string().trim().min(1, 'A reason is required for this action').max(500),
});

const ReturnFromStorageBody = z.object({
  id: z.string().trim().min(1),
  reason: z.string().trim().min(1, 'A reason is required for this action').max(500),
});

const IdParam = z.object({ id: z.string().trim().min(1) });

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateInventoryLegacyView = {
  stockListQuery: (req: Request) => parseOrThrow(StockListQuery, req.query, 'query string'),
  unreserveBody: (req: Request) => parseOrThrow(UnreserveBody, req.body, 'request body'),
  sendToStorageBody: (req: Request) => parseOrThrow(SendToStorageBody, req.body, 'request body'),
  updateStorageBody: (req: Request) => parseOrThrow(UpdateStorageBody, req.body, 'request body'),
  returnFromStorageBody: (req: Request) =>
    parseOrThrow(ReturnFromStorageBody, req.body, 'request body'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
