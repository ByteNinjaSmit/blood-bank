import { z } from 'zod';
import type { Request } from 'express';
import { ABO_GROUP, COMPONENT_TYPE, RH_FACTOR, SPECIAL_NEED } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const CreatePatientBody = z.object({
  patientPublicId: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(200),
  dob: z.coerce.date().optional(),
  sex: z.enum(['M', 'F', 'O']).optional(),
  medicalRecordNumber: z.string().trim().max(80).optional(),
  aboGroup: z.enum(ABO_GROUP).optional(),
  rhFactor: z.enum(RH_FACTOR).optional(),
  specialNeeds: z.array(z.enum(SPECIAL_NEED)).optional(),
});

const RequestedComponent = z.object({
  componentType: z.enum(COMPONENT_TYPE),
  units: z.coerce.number().int().min(1).max(50),
  aboGroup: z.enum(ABO_GROUP),
  rhFactor: z.enum(RH_FACTOR),
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']).default('ROUTINE'),
});

const PatientHistory = z.object({
  previousTransfusions: z.coerce.number().int().min(0).default(0),
  approximateDate: z.string().trim().optional(),
  presenceOfReaction: z.enum(['Presence', 'Absence', 'None']).default('None'),
});

const PatientPregnancy = z.object({
  numPregnancies: z.coerce.number().int().min(0).default(0),
  numMiscarriages: z.coerce.number().int().min(0).default(0),
  numChildrenWithHemolyticDisease: z.coerce.number().int().min(0).default(0),
});

const RequisitionPatient = z.object({
  name: z.string().trim().min(1).max(200),
  age: z.coerce.number().int().min(0),
  sex: z.enum(['M', 'F', 'O']),
  mrn: z.string().trim().max(80).optional(),
  diagnosis: z.string().trim().optional(),
  indication: z.string().trim().optional(),
  hb: z.coerce.number().optional(),
  history: PatientHistory.optional(),
  pregnancy: PatientPregnancy.optional(),
});

export const CreateRequisitionBody = z.object({
  hospitalId: z.string().regex(OBJECT_ID),
  patientId: z.string().regex(OBJECT_ID),
  clinicianName: z.string().trim().min(1).max(200),
  doctorName: z.string().trim().max(200).optional(),
  requiredAt: z.coerce.date().optional(),
  medicalOfficerSignature: z.string().trim().optional(),
  hospitalSeal: z.string().trim().optional(),
  patient: RequisitionPatient.optional(),
  requestedComponents: z.array(RequestedComponent).min(1),
});

export const RejectBody = z.object({
  reason: z.string().trim().min(1).max(300).optional(),
  rejectionReason: z.string().trim().min(1).max(300).optional(),
}).refine(data => data.reason || data.rejectionReason, {
  message: 'rejectionReason or reason is required',
  path: ['rejectionReason']
});

export const RequisitionIdParam = z.object({
  id: z.string().regex(OBJECT_ID, 'Invalid requisition id'),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ListRequisitionsQuery = z.object({
  status: z
    .preprocess((val) => (val === '' ? undefined : val), z.enum(['PENDING', 'MATCHED', 'CROSSMATCHED', 'APPROVED', 'ISSUED', 'COMPLETED', 'REJECTED']).optional()),
  hospitalId: z
    .preprocess((val) => (val === '' ? undefined : val), z.string().regex(OBJECT_ID).optional()),
  patientId: z
    .preprocess((val) => (val === '' ? undefined : val), z.string().regex(OBJECT_ID).optional()),
  search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  from: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.date().optional()),
  to: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.date().optional()),
  sortBy: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()).default('updatedAt'),
  order: z.preprocess((val) => (val === '' ? undefined : val), z.enum(['asc', 'desc']).optional()).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
});

export const ValidateRequisition = {
  createPatient: (req: Request) => parseOrThrow(CreatePatientBody, req.body, 'request body'),
  createBody: (req: Request) => parseOrThrow(CreateRequisitionBody, req.body, 'request body'),
  rejectBody: (req: Request) => parseOrThrow(RejectBody, req.body, 'request body'),
  idParam: (req: Request) => parseOrThrow(RequisitionIdParam, req.params, 'path params'),
  listQuery: (req: Request) => parseOrThrow(ListRequisitionsQuery, req.query, 'query string'),
};
