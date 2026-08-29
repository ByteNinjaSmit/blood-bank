import { z } from "zod";

const COMPONENT_CODES = ["WB", "PRBC", "FFP", "RDP", "CRYO", "SDP"];

export const createDiscardSchema = z
  .object({
    bagNo: z.string().trim().optional().default(""),
    batchNo: z.string().trim().optional().default(""),
    segmentNo: z.string().trim().optional().default(""),
    components: z.array(z.enum(COMPONENT_CODES)).default([]),
    reason: z.string().trim().min(1, "Reason is required"),
    description: z.string().trim().optional().default(""),
    ttiResults: z.record(z.string(), z.string()).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.bagNo && !(v.segmentNo && v.batchNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bagNo"],
        message: "Enter a bag number, or a segment number together with a batch number",
      });
    }
  });
