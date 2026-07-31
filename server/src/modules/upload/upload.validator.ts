import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

// Only allow characters that are safe to build an S3 key path segment from.
export const UploadQuery = z.object({
  folder: z
    .string()
    .max(120)
    .optional()
    .transform((s) => (s ?? '').replace(/[^a-zA-Z0-9_\-/]/g, '').replace(/^\/|\/$/g, '')),
});

export const DeleteQuery = z.object({
  url: z.string().trim().min(1, 'url query parameter is required').max(2048),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateUpload = {
  uploadQuery: (req: Request) => parseOrThrow(UploadQuery, req.query, 'query string'),
  deleteQuery: (req: Request) => parseOrThrow(DeleteQuery, req.query, 'query string'),
};
