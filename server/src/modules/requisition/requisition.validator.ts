import { z } from 'zod';
import type { Request } from 'express';
import {
  ABO_GROUP,
  CLINICAL_DISEASE,
  COMPONENT_TYPE,
  GRADING_REACTION,
  RH_FACTOR,
  SPECIAL_NEED,
} from '@/shared/enums';
import { ValidationError } from '@/shared/errors';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export const CreatePatientBody = z.object({
  patientPublicId: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().max(300).optional(),
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
  compatibilityMode: z.enum(['UNIVERSAL', 'MAJOR', 'MINOR']).default('UNIVERSAL'),
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
  address: z.string().trim().max(300).optional(),
  age: z.coerce.number().int().min(0),
  sex: z.enum(['M', 'F', 'O']),
  mrn: z.string().trim().max(80).optional(),
  diagnosis: z.string().trim().optional(),
  indication: z.string().trim().optional(),
  indicationCategory: z.enum(CLINICAL_DISEASE).optional(),
  otherDiseaseName: z.string().trim().optional(),
  hb: z.coerce.number().optional(),
  // The patient's own verified blood group — distinct from the ABO/Rh on
  // each requestedComponents line (which is the product being ordered,
  // not necessarily the patient's type). Used to seed the auto-created
  // Patient record so downstream incompatible-crossmatch replacement
  // logic (requisition.service.ts) matches against the real patient.
  aboGroup: z.enum(ABO_GROUP).optional(),
  rhFactor: z.enum(RH_FACTOR).optional(),
  specialNeeds: z.array(z.enum(SPECIAL_NEED)).optional(),
  history: PatientHistory.optional(),
  pregnancy: PatientPregnancy.optional(),
});

export const CreateRequisitionBody = z.object({
  hospitalId: z.string().regex(OBJECT_ID),
  patientId: z.string().regex(OBJECT_ID),
  clinicianName: z.string().trim().min(1).max(200),
  doctorName: z.string().trim().max(200).optional(),
  requiredAt: z.coerce.date().optional(),
  // Set once at creation, never editable via UpdateRequisitionBody — a
  // reservation must not silently become a requisition (or vice versa).
  purpose: z.enum(['REQUISITION', 'RESERVATION']).default('REQUISITION'),
  patient: RequisitionPatient.optional(),
  requestedComponents: z.array(RequestedComponent).min(1),
});

// Update reuses the create patient shape but keeps the legacy fallback
// defaults (name/sex) since older clients may omit them on edit.
const UpdateRequisitionPatient = RequisitionPatient.extend({
  name: z.string().trim().optional().default('Unnamed Patient'),
  sex: z.enum(['M', 'F', 'O']).optional().default('M'),
});

export const UpdateRequisitionBody = z.object({
  hospitalId: z.string().regex(OBJECT_ID),
  clinicianName: z.string().trim().optional(),
  doctorName: z.string().trim().max(200).optional(),
  requiredAt: z.coerce.date().optional(),
  patient: UpdateRequisitionPatient.optional(),
  requestedComponents: z.array(RequestedComponent).min(1),
  editReason: z.string().trim().max(500).optional(),
});

export const RejectBody = z
  .object({
    reason: z.string().trim().min(1).max(300).optional(),
    rejectionReason: z.string().trim().min(1).max(300).optional(),
  })
  .refine((data) => data.reason || data.rejectionReason, {
    message: 'rejectionReason or reason is required',
    path: ['rejectionReason'],
  });

export const RequisitionIdParam = z.object({
  id: z.string().regex(OBJECT_ID, 'Invalid requisition id'),
});

export const IssueAllBody = z.object({
  unitIds: z.array(z.string().trim().min(1)).optional(),
});

export const UpdateCrossmatchLegacyBody = z.object({
  inventoryId: z
    .string()
    .trim()
    .min(1, 'Provide inventoryId and crossmatchStatus (compatible | incompatible | pending)'),
  crossmatchStatus: z.enum(['compatible', 'incompatible', 'pending']),
  compatibilityResult: z.enum(['MAJOR_COMPATIBLE', 'MINOR_COMPATIBLE', 'UNIVERSAL']).optional(),
  crossmatchDoneAt: z.coerce.date().optional(),
  crossmatchSeenAt: z.coerce.date().optional(),
  cardNumber: z.string().trim().optional(),
});

export const ConfirmCompatibilityBody = z.object({
  unitId: z.string().trim().min(1),
  confirmed: z.boolean(),
});

export const RejectComponentBody = z.object({
  componentType: z.enum(COMPONENT_TYPE),
  reason: z.string().trim().min(1).max(500),
});

// One agglutination reaction cell; null clears it.
const Grade = z.enum(GRADING_REACTION).nullable().optional();

const GroupingWorksheet = z.object({
  cellGrouping: z
    .object({ antiA: Grade, antiA1: Grade, antiB: Grade, antiAB: Grade, antiH: Grade })
    .optional(),
  serumGrouping: z.object({ aCell: Grade, bCell: Grade, oCell: Grade }).optional(),
  rhTyping: z.object({ antiD: Grade, antiDBovine: Grade, indirectCoombs: Grade }).optional(),
});

export const RecipientGroupingBody = GroupingWorksheet;

export const MatchedUnitGroupingBody = z.object({
  unitId: z.string().trim().min(1),
  grouping: GroupingWorksheet,
});

export const SwapMatchedUnitBody = z.object({
  fromUnitId: z.string().trim().min(1),
  toUnitId: z.string().trim().min(1),
});

export const AvailableUnitsQuery = z.object({
  componentType: z.enum(COMPONENT_TYPE),
  aboGroup: z.preprocess((v) => (v === '' ? undefined : v), z.enum(ABO_GROUP).optional()),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ListRequisitionsQuery = z.object({
  status: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z
      .enum(['PENDING', 'MATCHED', 'CROSSMATCHED', 'APPROVED', 'ISSUED', 'COMPLETED', 'REJECTED'])
      .optional(),
  ),
  // Disease/Clinical Indication tab: hide rejected requisitions without
  // pinning the list to one exact status (unlike `status` above).
  excludeStatus: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z
      .enum(['PENDING', 'MATCHED', 'CROSSMATCHED', 'APPROVED', 'ISSUED', 'COMPLETED', 'REJECTED'])
      .optional(),
  ),
  hospitalId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().regex(OBJECT_ID).optional(),
  ),
  patientId: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().regex(OBJECT_ID).optional(),
  ),
  purpose: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['REQUISITION', 'RESERVATION']).optional(),
  ),
  // Disease/Clinical Indication tab: any requisition with a categorized
  // indication (Thalassemia/Sickle Cell Anaemia/Other), regardless of which.
  hasClinicalIndication: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.boolean().optional(),
  ),
  indicationCategory: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(CLINICAL_DISEASE).optional(),
  ),
  search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  urgency: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']).optional(),
  ),
  componentType: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(COMPONENT_TYPE).optional(),
  ),
  from: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.date().optional()),
  to: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.date().optional()),
  sortBy: z
    .preprocess((val) => (val === '' ? undefined : val), z.string().optional())
    .default('updatedAt'),
  order: z
    .preprocess((val) => (val === '' ? undefined : val), z.enum(['asc', 'desc']).optional())
    .default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
});

export const ValidateRequisition = {
  createPatient: (req: Request) => parseOrThrow(CreatePatientBody, req.body, 'request body'),
  createBody: (req: Request) => parseOrThrow(CreateRequisitionBody, req.body, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateRequisitionBody, req.body, 'request body'),
  rejectBody: (req: Request) => parseOrThrow(RejectBody, req.body, 'request body'),
  idParam: (req: Request) => parseOrThrow(RequisitionIdParam, req.params, 'path params'),
  listQuery: (req: Request) => parseOrThrow(ListRequisitionsQuery, req.query, 'query string'),
  issueAllBody: (req: Request) => parseOrThrow(IssueAllBody, req.body, 'request body'),
  updateCrossmatchLegacyBody: (req: Request) =>
    parseOrThrow(UpdateCrossmatchLegacyBody, req.body, 'request body'),
  recipientGroupingBody: (req: Request) =>
    parseOrThrow(RecipientGroupingBody, req.body, 'request body'),
  matchedUnitGroupingBody: (req: Request) =>
    parseOrThrow(MatchedUnitGroupingBody, req.body, 'request body'),
  swapMatchedUnitBody: (req: Request) =>
    parseOrThrow(SwapMatchedUnitBody, req.body, 'request body'),
  availableUnitsQuery: (req: Request) =>
    parseOrThrow(AvailableUnitsQuery, req.query, 'query string'),
  confirmCompatibilityBody: (req: Request) =>
    parseOrThrow(ConfirmCompatibilityBody, req.body, 'request body'),
  rejectComponentBody: (req: Request) =>
    parseOrThrow(RejectComponentBody, req.body, 'request body'),
};
