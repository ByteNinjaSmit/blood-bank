import { z } from 'zod';
import type { Request } from 'express';
import { TTI_RESULT, TTI_TEST } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const TestEntry = z.object({
  testName: z.enum(TTI_TEST),
  method: z.enum(['ELISA', 'NAT', 'RAPID', 'CLIA']),
  result: z.enum(TTI_RESULT),
  performedAt: z.coerce.date().default(() => new Date()),
  machineId: z.string().trim().max(120).optional(),
  kitLot: z.string().trim().max(120).optional(),
});

export const RecordTestsBody = z.object({
  tests: z.array(TestEntry).min(1),
});

export const DonationIdParam = z.object({
  donationId: z.string().trim().min(1).max(80),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateTti = {
  recordBody: (req: Request) => parseOrThrow(RecordTestsBody, req.body, 'request body'),
  donationIdParam: (req: Request) => parseOrThrow(DonationIdParam, req.params, 'path params'),
};
