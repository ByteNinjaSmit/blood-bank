import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

export const ListFeedbackQuery = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export type ListFeedbackInput = z.infer<typeof ListFeedbackQuery>;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateFeedback = {
  listQuery: (req: Request) => parseOrThrow(ListFeedbackQuery, req.query, 'query string'),
};
