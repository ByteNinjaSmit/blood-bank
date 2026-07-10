import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const ListAppointmentsQuery = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const UpdateAppointmentStatusBody = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type ListAppointmentsInput = z.infer<typeof ListAppointmentsQuery>;
export type UpdateAppointmentStatusInput = z.infer<typeof UpdateAppointmentStatusBody>;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateAppointment = {
  listQuery: (req: Request) => parseOrThrow(ListAppointmentsQuery, req.query, 'query string'),
  updateStatusBody: (req: Request) => parseOrThrow(UpdateAppointmentStatusBody, req.body, 'request body'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
