// Extracts the mandatory "Reason for Change" sibling field the frontend
// sends alongside an update body (see client/src/hooks/useEditWithReason.jsx).
// Never persisted into the business document — every zod update-body
// schema in the codebase strips unknown keys by default, so `_editReason`
// is automatically dropped from the validated patch; this helper reads
// it directly off the raw request body before validation runs, so it
// can be threaded into the audit call only.

import type { Request } from 'express';

export function extractEditReason(req: Request): string | undefined {
  const raw = (req.body as Record<string, unknown> | undefined)?._editReason;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}
