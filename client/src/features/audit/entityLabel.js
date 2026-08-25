// A raw Mongo ObjectId (entry.entityId) is never meaningful to a staff
// user — always prefer the backend-supplied entityLabel, and fall back to
// a plain text placeholder instead of the bare id when it's missing.
export function entityRef(entry) {
  return entry?.entityLabel || 'Unlabeled record';
}
