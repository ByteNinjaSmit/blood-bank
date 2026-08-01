import { describe, it, expect } from 'vitest';
import { redactSnapshot } from './audit-redaction-map';

describe('audit redaction — global secret denylist', () => {
  it('strips password fields from any entityType, even a full User document', () => {
    const user = {
      email: 'a@b.com',
      password: 'plaintext-should-never-appear',
      passwordHash: '$2a$10$abcdef',
      role: 'system-admin',
    };
    const redacted = redactSnapshot(user, 'User') as Record<string, unknown>;
    expect(redacted.password).toBeUndefined();
    expect(redacted.passwordHash).toBeUndefined();
    expect(redacted.email).toBe('a@b.com');
    expect(redacted.role).toBe('system-admin');
  });

  it('strips OTP and token fields regardless of entityType', () => {
    const payload = {
      otp: '123456',
      token: 'jwt.token.here',
      refreshToken: 'rt',
      accessToken: 'at',
    };
    const redacted = redactSnapshot(payload, 'auth') as Record<string, unknown>;
    expect(redacted.otp).toBeUndefined();
    expect(redacted.token).toBeUndefined();
    expect(redacted.refreshToken).toBeUndefined();
    expect(redacted.accessToken).toBeUndefined();
  });

  it('strips secrets nested inside objects, not just top level', () => {
    const nested = { profile: { name: 'x', password: 'secret' } };
    const redacted = redactSnapshot(nested, 'User') as { profile: Record<string, unknown> };
    expect(redacted.profile.password).toBeUndefined();
    expect(redacted.profile.name).toBe('x');
  });

  it('masks donor PII fields rather than deleting them', () => {
    const donor = { phone: '9999999999', name: 'Jane' };
    const redacted = redactSnapshot(donor, 'Donor') as Record<string, unknown>;
    expect(redacted.phone).toBe('[REDACTED]');
    expect(redacted.name).toBe('Jane');
  });

  it('passes through unrelated entity types unchanged (besides global denylist)', () => {
    const unit = { status: 'RELEASED', unitId: 'U-1' };
    const redacted = redactSnapshot(unit, 'BloodUnit');
    expect(redacted).toEqual(unit);
  });

  it('handles null/undefined snapshots safely', () => {
    expect(redactSnapshot(undefined, 'User')).toBeUndefined();
    expect(redactSnapshot(null, 'User')).toBeNull();
  });
});
