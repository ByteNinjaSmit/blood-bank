import { z } from 'zod';

// Mirrors the donation-creation wizard's Bag Information + Medical
// Examination steps field-for-field (see BagInfoStep.jsx /
// ExamFitnessStep.jsx) so a correction made here uses the exact same
// fields, options and semantics as the original entry. Donor identity
// fields are intentionally out of scope — this only corrects what was
// recorded for THIS donation event.
export const donationEditSchema = z.object({
  // Bag Information
  typeOfBag: z.string().trim().optional(),
  lotNo: z.string().trim().optional(),
  bagNo: z.string().trim().min(1, 'Bag number is required'),
  segmentNo: z.string().trim().optional(),
  donationType: z.string().trim().optional(),
  collectedAt: z.string().min(1, 'Collection date/time is required'),
  notes: z.string().trim().max(1000).optional(),

  // Fitness
  isFit: z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional()),
  rejectionReason: z.string().trim().max(500).optional(),

  // Medical Examination — same field names as ExamFitnessStep's formData
  weightKg: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  hb: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  tempC: z.union([z.coerce.number(), z.literal('')]).optional(),
  bp: z.string().trim().optional(),
  o2Level: z.union([z.coerce.number().min(0).max(100), z.literal('')]).optional(),
  pulse: z.union([z.coerce.number().positive(), z.literal('')]).optional(),
  pedalOedema: z.string().trim().optional(),
  lymphadenopathy: z.string().trim().optional(),
  cyanosis: z.string().trim().optional(),
  systematicExam: z.string().trim().optional(),
  volumeGmMl: z.string().trim().optional(),
  skinDiseaseFreeAtPhlebotomy: z.string().trim().optional(),
  armsFreeFromPunctureScars: z.string().trim().optional(),
});
