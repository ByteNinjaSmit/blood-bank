// Computes which top-level keys differ between a before/after pair, for
// storage on AuditLog.changedFields so the Audit Viewer never has to
// recompute a diff client-side.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * CREATE (before undefined/null): every key in `after` is "changed".
 * DELETE (after undefined/null): every key in `before` is "changed".
 * UPDATE: only keys present in either object whose values differ.
 */
export function diffChangedFields(before: unknown, after: unknown): string[] {
  const beforeObj = isPlainObject(before) ? before : undefined;
  const afterObj = isPlainObject(after) ? after : undefined;

  if (!beforeObj && afterObj) return Object.keys(afterObj);
  if (beforeObj && !afterObj) return Object.keys(beforeObj);
  if (!beforeObj && !afterObj) return [];

  const keys = new Set([...Object.keys(beforeObj!), ...Object.keys(afterObj!)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (!valuesEqual(beforeObj![key], afterObj![key])) changed.push(key);
  }
  return changed;
}
