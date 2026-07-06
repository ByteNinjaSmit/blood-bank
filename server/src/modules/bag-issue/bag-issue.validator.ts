import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { BAG_ISSUE_STATUS } from '@/shared/enums';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

export const CreateBagIssueBody = z.object({
  stockId: z.string().regex(OBJECT_ID, 'Invalid stockId'),
  issuedById: z.string().regex(OBJECT_ID, 'Invalid issuedById'),
  collectionRoom: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const MarkUsedBody = z.object({
  donorId: z.string().regex(OBJECT_ID, 'Invalid donorId').optional(),
  donationId: z.string().regex(OBJECT_ID, 'Invalid donationId').optional(),
});

export const ListBagIssueQuery = z.object({
  status: z.enum(BAG_ISSUE_STATUS).optional(),
  stockId: z.string().regex(OBJECT_ID).optional(),
  donorId: z.string().regex(OBJECT_ID).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type CreateBagIssueInput = z.infer<typeof CreateBagIssueBody>;
export type MarkUsedInput = z.infer<typeof MarkUsedBody>;
export type ListBagIssueInput = z.infer<typeof ListBagIssueQuery>;

export const ValidateBagIssue = {
  createBody: (req: Request) => parseOrThrow(CreateBagIssueBody, req.body, 'request body'),
  markUsedBody: (req: Request) => parseOrThrow(MarkUsedBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListBagIssueQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
