import { z } from 'zod';
import type { Request } from 'express';
import { ValidationError } from '@/shared/errors';
import { DISCARD_REASON, BAG_DISCARD_REASON } from '@/shared/enums';

const ListQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(5000).optional(),
  search: z.string().trim().max(120).optional(),
  itemType: z.string().trim().optional(),
  discardType: z.enum(['manual', 'system', 'all']).optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const CreateBody = z
  .object({
    // Optional: an empty (unfilled) bag is discarded by segment + batch
    // with no bag number yet allotted.
    bagNo: z.string().trim().optional(),
    batchNo: z.string().trim().optional(),
    segmentNo: z.string().trim().optional(),
    // Which components of the bag to discard (when it has several in
    // stock). Absent => discard the only in-stock unit / all of them.
    components: z.array(z.enum(['WB', 'PRBC', 'FFP', 'RDP', 'CRYO', 'SDP'])).optional(),
    reason: z.string().trim().min(1, 'Discard reason is required.'),
    description: z.string().trim().optional(),
    ttiResults: z.record(z.string(), z.string()).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.bagNo && !(v.segmentNo && v.batchNo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide a bag number, or a segment number together with a batch number.',
        path: ['bagNo'],
      });
    }
    // A bag/segment that held blood uses the clinical DISCARD_REASON
    // vocabulary; an empty (unfilled) bag uses the procurement
    // BAG_DISCARD_REASON vocabulary. Either way the reason must be a known
    // enum value — never free text — so the discard register and the
    // biomedical-waste manifest stay analysable.
    const allowed = v.bagNo ? DISCARD_REASON : BAG_DISCARD_REASON;
    if (!allowed.includes(v.reason as never)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unknown discard reason "${v.reason}" for a ${v.bagNo ? 'filled' : 'empty'} bag.`,
        path: ['reason'],
      });
    }
  });

const UnitIdParam = z.object({
  unitId: z.string().trim().min(1, 'unitId is required'),
});

const BagComponentsQuery = z.object({
  bagNo: z.string().trim().min(1, 'bagNo is required'),
});

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, where: string): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new ValidationError(`Invalid ${where}`, r.error.issues);
  return r.data;
}

export const ValidateDiscard = {
  listQuery: (req: Request) => parseOrThrow(ListQuery, req.query, 'query string'),
  createBody: (req: Request) => parseOrThrow(CreateBody, req.body, 'request body'),
  unitIdParam: (req: Request) => parseOrThrow(UnitIdParam, req.params, 'path params'),
  bagComponentsQuery: (req: Request) =>
    parseOrThrow(BagComponentsQuery, req.query, 'query string'),
};
