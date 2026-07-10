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

export const NearExpiryQuery = z.object({
  days: z.coerce.number().int().min(1).max(30).default(3),
});

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const PatientHistoryValidator = z.object({
  previousTransfusions: z.coerce.number().int().min(0).default(0),
  approximateDate: z.string().trim().optional(),
  presenceOfReaction: z.enum(['Presence', 'Absence', 'None']).default('None'),
});

const PatientPregnancyValidator = z.object({
  numPregnancies: z.coerce.number().int().min(0).default(0),
  numMiscarriages: z.coerce.number().int().min(0).default(0),
  numChildrenWithHemolyticDisease: z.coerce.number().int().min(0).default(0),
});

export const PatientValidator = z.object({
  name: z.string().trim().min(1).max(200),
  age: z.coerce.number().int().min(0).max(120),
  sex: z.enum(['M', 'F', 'O']),
  mrn: z.string().trim().max(80).optional(),
  diagnosis: z.string().trim().optional(),
  indication: z.string().trim().optional(),
  hb: z.coerce.number().optional(),
  specialNeeds: z.array(z.enum(SPECIAL_NEED)).optional().default([]),
  history: PatientHistoryValidator.optional(),
  pregnancy: PatientPregnancyValidator.optional(),
});

export const ReserveItemValidator = z.object({
  componentType: z.string().trim(),
  units: z.coerce.number().int().min(1).max(50),
  bloodGroup: z.enum(ABO_GROUP),
  rh: z.string().trim(),
});

export const ReserveBodyValidator = z.object({
  hospitalId: z.string().regex(OBJECT_ID),
  reservedUntil: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional()
  ),
  doctorName: z.string().trim().max(200).optional(),
  medicalOfficerSignature: z.string().trim().optional(),
  hospitalSeal: z.string().trim().optional(),
  patient: PatientValidator,
  items: z.array(ReserveItemValidator).min(1),
});

export const ValidateInventory = {
  selectQuery: (req: Request) => parseOrThrow(SelectQuery, req.query, 'query string'),
  nearExpiryQuery: (req: Request) => parseOrThrow(NearExpiryQuery, req.query, 'query string'),
  reserveBody: (req: Request) => parseOrThrow(ReserveBodyValidator, req.body, 'request body'),
};
