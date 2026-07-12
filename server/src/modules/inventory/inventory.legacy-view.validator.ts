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
});

const UnreserveBody = z.object({
  inventoryIds: z.array(z.string().trim().min(1)).min(1, 'inventoryIds must be a non-empty array'),
  userId: z.string().trim().optional(),
});

const ClinicalIndicationPatient = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  disease: z.string().trim().min(1),
  otherDiseaseName: z.string().trim().optional(),
}).passthrough();

const SendToStorageBody = z.object({
  location: z.string().trim().optional(),
  otherLocationName: z.string().trim().optional(),
  bags: z
    .array(z.object({ bagIds: z.array(z.string().trim().min(1)).default([]) }))
    .min(1, 'bags must be a non-empty array'),
  userId: z.string().trim().optional(),
  dispatchType: z.string().trim().optional(),
  clinicalIndicationPatient: ClinicalIndicationPatient.optional(),
  sentDate: z.string().trim().optional(),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateInventoryLegacyView = {
  stockListQuery: (req: Request) => parseOrThrow(StockListQuery, req.query, 'query string'),
  unreserveBody: (req: Request) => parseOrThrow(UnreserveBody, req.body, 'request body'),
  sendToStorageBody: (req: Request) => parseOrThrow(SendToStorageBody, req.body, 'request body'),
};
