import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const CreateDonorCardBody = z.object({
  requisitionId: z.string().regex(OBJECT_ID, 'Invalid requisition id'),
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(500),
  bloodGroup: z.string().trim().min(1).max(10),
  donationCardNumber: z.string().trim().min(1).max(100),
});

export const RequisitionIdParam = z.object({
  requisitionId: z.string().regex(OBJECT_ID, 'Invalid requisition id'),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateDonorCard = {
  createBody: (req: Request) => parseOrThrow(CreateDonorCardBody, req.body, 'request body'),
  requisitionIdParam: (req: Request) => parseOrThrow(RequisitionIdParam, req.params, 'path params'),
};
