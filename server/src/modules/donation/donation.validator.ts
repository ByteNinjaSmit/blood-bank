import { z } from 'zod';
import type { Request } from 'express';
import { ABO_GROUP, COMPONENT_TYPE, DONATION_TYPE, RH_FACTOR } from '@/shared/enums';
import { ValidationError } from '@/shared/errors';
import { CreateDonorBody } from '@/modules/donor/donor.validator';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const blankToUndef = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);

export const MedicalExamSchema = z.object({
  weightKg: z.coerce.number().positive().max(300).optional(),
  hbGdl: z.coerce.number().positive().max(25).optional(),
  temperatureCelsius: z.coerce.number().min(30).max(45).optional(),
  pulseBpm: z.coerce.number().int().min(30).max(220).optional(),
  bloodPressure: z
    .object({
      systolic: z.coerce.number().int().min(60).max(260),
      diastolic: z.coerce.number().int().min(30).max(180),
    })
    .optional(),
  hasPedalOedema: z.boolean().optional(),
  oxygenSaturationPercent: z.coerce.number().min(50).max(100).optional(),
  hasLymphadenopathy: z.boolean().optional(),
  hasCyanosis: z.boolean().optional(),
  systemicExamNotes: blankToUndef(z.string().trim().max(500).optional()),
  skinClearAtPhlebotomy: z.boolean().optional(),
  armsFreeOfPunctureScars: z.boolean().optional(),
  volumeMl: z.coerce.number().positive().max(700).optional(),
});

export const DonorFitnessSchema = z.object({
  isFit: z.boolean(),
  rejectionReason: blankToUndef(z.string().trim().max(300).optional()),
  rejectedAtStep: z.enum(['QUESTIONNAIRE', 'VITALS', 'COLLECTION', 'POST_DONATION']).optional(),
});

const UnitTemplateSchema = z.object({
  componentType: z.enum(COMPONENT_TYPE),
  volumeMl: z.coerce.number().positive().max(700),
  shelfLifeDays: z.coerce.number().int().positive().max(720).optional(),
});

export const CreateDonationBody = z.object({
  donor: z.string().regex(OBJECT_ID, 'Invalid donor id'),
  donationType: z.enum(DONATION_TYPE),
  collectedAt: z.coerce.date(),
  campId: blankToUndef(z.string().regex(OBJECT_ID).optional()),
  phlebotomistId: blankToUndef(z.string().regex(OBJECT_ID).optional()),
  medicalExam: MedicalExamSchema.optional(),
  donorFitness: DonorFitnessSchema,
  questionnaireFlags: z.record(z.string(), z.boolean()).optional(),
  notes: blankToUndef(z.string().trim().max(1000).optional()),
  bloodGroup: z.enum(ABO_GROUP),
  rhFactor: z.enum(RH_FACTOR),
  unitTemplates: z.array(UnitTemplateSchema).optional(),
  typeOfBag: z.enum(['SB', 'DB', 'TB', 'QB']).optional(),
  bagNo: z.string().trim().min(1).max(100).optional(),
  segmentNo: z.string().trim().min(1).max(100).optional(),
  lotNo: z.string().trim().min(1).max(100).optional(),
});
export type CreateDonationInput = z.infer<typeof CreateDonationBody>;

export const ListDonationsQuery = z.object({
  donorId: blankToUndef(z.string().regex(OBJECT_ID).optional()),
  donationType: z.enum(DONATION_TYPE).optional(),
  source: z.enum(['inhouse', 'camp']).optional(),
  campId: blankToUndef(z.string().regex(OBJECT_ID).optional()),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
  // Recycle Bin uses deletedOnly=true to list soft-deleted donations; Master
  // Register never sets it, so soft-deleted donations stay hidden there.
  deletedOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(10000).default(25),
});
export type ListDonationsInput = z.infer<typeof ListDonationsQuery>;

export const UpdateDonationBody = z.object({
  collectedAt: z.coerce.date().optional(),
  bagNo: z.string().trim().min(1).max(100).optional(),
  segmentNo: z.string().trim().min(1).max(100).optional(),
  lotNo: z.string().trim().min(1).max(100).optional(),
  notes: blankToUndef(z.string().trim().max(1000).optional()),
  phlebotomistId: blankToUndef(z.string().regex(OBJECT_ID, 'Invalid phlebotomist id').optional()),
});
export type UpdateDonationInput = z.infer<typeof UpdateDonationBody>;

export const DonationIdParam = z.object({
  id: z.string().regex(OBJECT_ID, 'Invalid donation id'),
});

export const DeleteReasonBody = z.object({
  reason: z.string().trim().min(1, 'A reason is required for this action').max(500),
});

// ── Inward Donation (bag-first) ─────────────────────────────────────────

const ProvisionalBloodGroupSchema = z.object({
  aboGroup: z.enum(ABO_GROUP),
  rhFactor: z.enum(RH_FACTOR),
});

export const CreateInwardDonationBody = z
  .object({
    bagNo: z.string().trim().min(1).max(100),
    lotNo: blankToUndef(z.string().trim().min(1).max(100).optional()),
    segmentNo: blankToUndef(z.string().trim().min(1).max(100).optional()),
    collectionDate: z.coerce.date(),
    // "HH:mm" — merged onto collectionDate server-side. Optional; when
    // absent, collectionDate is used as the full collection timestamp.
    collectionTime: blankToUndef(
      z
        .string()
        .regex(/^\d{2}:\d{2}$/, 'collectionTime must be HH:mm')
        .optional(),
    ),
    provisionalBloodGroup: ProvisionalBloodGroupSchema,
    donationType: z.enum(DONATION_TYPE).default('WHOLE_BLOOD'),
    typeOfBag: z.enum(['SB', 'DB', 'TB', 'QB']).optional(),
    source: z.enum(['inhouse', 'camp']).default('inhouse'),
    campId: blankToUndef(z.string().regex(OBJECT_ID).optional()),
  })
  .refine((v) => v.source !== 'camp' || Boolean(v.campId), {
    message: 'campId is required when source is camp',
    path: ['campId'],
  });
export type CreateInwardDonationInput = z.infer<typeof CreateInwardDonationBody>;

export const LinkDonorBody = z.union([
  z.object({ existingDonorId: z.string().regex(OBJECT_ID, 'Invalid donor id') }),
  CreateDonorBody,
]);
export type LinkDonorInput = z.infer<typeof LinkDonorBody>;

export const MedicalHistoryBody = z.object({
  medicalExam: MedicalExamSchema.optional(),
  questionnaireFlags: z.record(z.string(), z.boolean()).optional(),
});
export type MedicalHistoryInput = z.infer<typeof MedicalHistoryBody>;

export const FinalizeInwardBody = z.object({
  donorFitness: DonorFitnessSchema,
  medicalExam: MedicalExamSchema.optional(),
});
export type FinalizeInwardInput = z.infer<typeof FinalizeInwardBody>;

export const ListIncompleteQuery = z.object({
  q: blankToUndef(z.string().trim().max(200).optional()),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(25),
});
export type ListIncompleteInput = z.infer<typeof ListIncompleteQuery>;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    // Surface exactly which field failed and why — a bare "Invalid
    // request body" gives neither the caller nor the server log enough
    // to diagnose a rejected edit/create without reproducing it.
    const first = result.error.issues[0];
    const detail = first ? ` — ${first.path.join('.') || '(root)'}: ${first.message}` : '';
    throw new ValidationError(`Invalid ${where}${detail}`, result.error.issues);
  }
  return result.data;
}

export const ValidateDonation = {
  createBody: (req: Request) => parseOrThrow(CreateDonationBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListDonationsQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(DonationIdParam, req.params, 'path params'),
  deleteReasonBody: (req: Request) =>
    parseOrThrow(DeleteReasonBody, req.body ?? {}, 'request body'),
  updateBody: (req: Request) => parseOrThrow(UpdateDonationBody, req.body ?? {}, 'request body'),
  createInwardBody: (req: Request) =>
    parseOrThrow(CreateInwardDonationBody, req.body, 'request body'),
  linkDonorBody: (req: Request) => parseOrThrow(LinkDonorBody, req.body, 'request body'),
  medicalHistoryBody: (req: Request) =>
    parseOrThrow(MedicalHistoryBody, req.body ?? {}, 'request body'),
  finalizeInwardBody: (req: Request) =>
    parseOrThrow(FinalizeInwardBody, req.body, 'request body'),
  listIncompleteQuery: (req: Request) =>
    parseOrThrow(ListIncompleteQuery, req.query, 'query string'),
};
