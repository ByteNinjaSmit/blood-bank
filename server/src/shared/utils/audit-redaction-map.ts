// Field-level redaction applied to AuditLog before/after snapshots
// before they are ever written. Two layers:
//
// 1. A global hard denylist — always stripped, for every entityType,
//    no exceptions. Catches secrets even if a caller accidentally
//    passes a full document (e.g. a User doc containing passwordHash).
// 2. A per-entityType allow/deny list for PII/PHI (donor contact info,
//    raw TTI values, etc.) — under-disclosure is the safe default.
//
// Redaction happens at write time, not read time: the viewer can never
// leak what was never stored.

const GLOBAL_SECRET_KEYS = [
  'password',
  'passwordhash',
  'otp',
  'token',
  'refreshtoken',
  'accesstoken',
  'jwt',
  'secret',
];

const REDACTED = '[REDACTED]';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSecretKey(key: string): boolean {
  const k = key.toLowerCase();
  return GLOBAL_SECRET_KEYS.some((s) => k.includes(s));
}

// Per-entityType keys to mask (kept in the object but value replaced)
// rather than stripped outright, so the viewer can still show "a phone
// number was changed" without exposing the value.
const ENTITY_MASK_FIELDS: Readonly<Record<string, ReadonlyArray<string>>> = {
  donor: ['phone', 'address', 'email', 'aadhaar', 'idProofNumber'],
  Donor: ['phone', 'address', 'email', 'aadhaar', 'idProofNumber'],
  user: ['phone', 'address'],
  User: ['phone', 'address'],
  tti: ['rawValue', 'odValue', 'cutoffValue'],
  TTIResult: ['rawValue', 'odValue', 'cutoffValue'],
};

function redactObject(value: unknown, entityType: string, seen = new WeakSet<object>()): unknown {
  if (!isPlainObject(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  const maskFields = ENTITY_MASK_FIELDS[entityType] ?? [];
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (isSecretKey(key)) {
      // secrets are never stored, not even masked — omit entirely
      continue;
    }
    if (maskFields.includes(key)) {
      out[key] = REDACTED;
      continue;
    }
    out[key] = isPlainObject(val) ? redactObject(val, entityType, seen) : val;
  }
  return out;
}

export function redactSnapshot(value: unknown, entityType: string): unknown {
  if (value === undefined || value === null) return value;
  return redactObject(value, entityType);
}
