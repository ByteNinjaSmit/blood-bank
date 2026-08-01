import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { INSPECTION_DECISION } from '@/shared/enums';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(`Invalid ${where}`, result.error.issues);
  return result.data;
}

const PhysicalChecksSchema = z
  .object({
    sealIntact: z.boolean().optional(),
    noLeakage: z.boolean().optional(),
    tubeIntegrity: z.boolean().optional(),
    needleCondition: z.boolean().optional(),
    labelPresence: z.boolean().optional(),
    sterilityCheck: z.boolean().optional(),
    packagingCondition: z.boolean().optional(),
  })
  .optional();

export const CreateBagInspectionBody = z.object({
  grnId: z.string().regex(OBJECT_ID, 'Invalid grnId'),
  stockId: z.string().regex(OBJECT_ID, 'Invalid stockId').optional(),
  batchNumber: z.string().trim().min(1).max(100),
  inspectionDate: z.coerce.date(),
  inspectedById: z.string().regex(OBJECT_ID, 'Invalid inspectedById'),
  sampleSize: z.number().int().positive(),
  physicalChecks: PhysicalChecksSchema,
  anticoagulantVolumeOk: z.boolean().optional(),
  tubePatency: z.boolean().optional(),
  observation: z.string().trim().max(2000).optional(),
  decision: z.enum(INSPECTION_DECISION),
  rejectionReason: z.string().trim().max(1000).optional(),
  testingType: z.enum(['EMPTY', 'WB', 'PRBC', 'FFP', 'RDP', 'CRYO', 'OTHER']).optional(),
  testingStatus: z.enum(['SENT', 'REPORT_RECEIVED']).optional(),
  sentDate: z.coerce.date().optional(),
  testingLab: z.string().trim().max(200).optional(),
  bagNo: z.string().trim().min(1).max(100).optional(),
  segmentNo: z.string().trim().min(1).max(100).optional(),
  bloodGroup: z.string().trim().max(20).optional(),
});

export const UpdateBagInspectionReportBody = z.object({
  reportDate: z.coerce.date().optional(),
  bagNo: z.string().trim().max(100).optional(),
  segmentNo: z.string().trim().max(100).optional(),
  bloodGroup: z.string().trim().max(20).optional(),
  testResult: z.string().trim().max(1000).optional(),
  factorVIII: z.number().optional(),
  fibrinogen: z.number().optional(),
  reportImage: z.string().trim().optional().nullable(),
  physicalChecks: PhysicalChecksSchema.optional(),
  anticoagulantVolumeOk: z.boolean().optional(),
  tubePatency: z.boolean().optional(),
  decision: z.enum(INSPECTION_DECISION).optional(),
  testingLab: z.string().trim().max(200).optional(),
  sentDate: z.coerce.date().optional(),
  rejectionReason: z.string().trim().max(1000).optional(),
  testingStatus: z.enum(['SENT', 'REPORT_RECEIVED']).optional(),
});

export const ListBagInspectionQuery = z.object({
  grnId: z.string().regex(OBJECT_ID).optional(),
  batchNumber: z.string().trim().max(100).optional(),
  decision: z.enum(INSPECTION_DECISION).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const IdParam = z.object({ id: z.string().regex(OBJECT_ID, 'Invalid id') });

export type CreateBagInspectionInput = z.infer<typeof CreateBagInspectionBody>;
export type UpdateBagInspectionReportInput = z.infer<typeof UpdateBagInspectionReportBody>;
export type ListBagInspectionInput = z.infer<typeof ListBagInspectionQuery>;

export const ValidateBagInspection = {
  createBody: (req: Request) => parseOrThrow(CreateBagInspectionBody, req.body, 'request body'),
  updateReportBody: (req: Request) =>
    parseOrThrow(UpdateBagInspectionReportBody, req.body, 'request body'),
  listQuery: (req: Request) => parseOrThrow(ListBagInspectionQuery, req.query, 'query string'),
  idParam: (req: Request) => parseOrThrow(IdParam, req.params, 'path params'),
};
