import { z } from 'zod';

// Clerical-field edit only — donor identity fields and medicalExam.volumeMl
// are intentionally out of scope (see donation.controller.ts update()).
export const donationEditSchema = z.object({
  bagNo: z.string().trim().min(1, 'Bag number is required'),
  segmentNo: z.string().trim().optional(),
  lotNo: z.string().trim().optional(),
  collectedAt: z.string().min(1, 'Collection date/time is required'),
  notes: z.string().trim().max(1000).optional(),
  phlebotomistId: z.string().optional(),
});
