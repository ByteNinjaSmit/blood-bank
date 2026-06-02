import { z } from 'zod';
import type { Request } from 'express';
import { ABO_GROUP, COMPONENT_TYPE, RH_FACTOR, SPECIAL_NEED } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const csvSpecialNeeds = z
  .string()
  .optional()
  .transform((s) =>
    s
      ? s
          .split(',')
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean)
      : [],
  )
  .pipe(z.array(z.enum(SPECIAL_NEED)));

export const SelectQuery = z.object({
  component: z.enum(COMPONENT_TYPE),
  aboGroup: z.enum(ABO_GROUP),
  rhFactor: z.enum(RH_FACTOR),
  specialNeeds: csvSpecialNeeds,
  unitsRequired: z.coerce.number().int().min(1).max(50).default(1),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateInventory = {
  selectQuery: (req: Request) => parseOrThrow(SelectQuery, req.query, 'query string'),
};
