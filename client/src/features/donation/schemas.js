import { z } from 'zod';

// Clerical + medical-exam edit. Donor identity fields are intentionally
// out of scope — this only corrects what was recorded for THIS donation
// event (bag/segment/batch identifiers, collection time, notes, the
// medical exam vitals taken at donation, and the fitness decision).
export const donationEditSchema = z.object({
  bagNo: z.string().trim().min(1, 'Bag number is required'),
  segmentNo: z.string().trim().optional(),
  lotNo: z.string().trim().optional(),
  collectedAt: z.string().min(1, 'Collection date/time is required'),
  notes: z.string().trim().max(1000).optional(),
  isFit: z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional()),
  rejectionReason: z.string().trim().max(500).optional(),
  weightKg: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  hbGdl: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  temperatureCelsius: z.union([z.coerce.number(), z.literal('')]).optional(),
  pulseBpm: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  bloodPressureSystolic: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  bloodPressureDiastolic: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  oxygenSaturationPercent: z.union([z.coerce.number().min(0).max(100), z.literal('')]).optional(),
  volumeMl: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  hasPedalOedema: z.boolean().optional(),
  hasLymphadenopathy: z.boolean().optional(),
  hasCyanosis: z.boolean().optional(),
  skinClearAtPhlebotomy: z.boolean().optional(),
  armsFreeOfPunctureScars: z.boolean().optional(),
  systemicExamNotes: z.string().trim().max(1000).optional(),
});
