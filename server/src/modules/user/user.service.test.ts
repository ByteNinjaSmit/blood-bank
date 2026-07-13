import { describe, it, expect, vi, beforeEach } from 'vitest';

const auditRecord = vi.fn().mockResolvedValue(undefined);
vi.mock('@/modules/audit/audit.service', () => ({
  auditService: { record: (...args: unknown[]) => auditRecord(...args) },
}));

vi.mock('@/modules/user/user.repository', () => {
  const userDto = {
    id: 'u1',
    publicId: 'STF-1',
    name: { first: 'A', last: 'B' },
    email: 'a@b.com',
    role: 'system-admin',
    status: 'active',
    permissions: [],
  };
  return {
    userRepo: {
      existsByEmail: vi.fn().mockResolvedValue(false),
      findByIdOrPublicId: vi.fn().mockResolvedValue(userDto),
      updateByIdOrPublicId: vi.fn().mockResolvedValue(userDto),
      nextPublicId: vi.fn().mockResolvedValue('STF-1'),
      create: vi.fn().mockResolvedValue(userDto),
    },
  };
});

vi.mock('@/core/cache', () => ({
  cached: (_key: string, _ttl: number, fetch: () => unknown) => fetch(),
  invalidate: vi.fn().mockResolvedValue(undefined),
}));

import { userService } from './user.service';

describe('user-service.update — password change auditing', () => {
  beforeEach(() => {
    auditRecord.mockClear();
  });

  it('records a dedicated password-changed event with no before/after snapshot', async () => {
    await userService.update('u1', { password: 'new-plaintext-password' }, 'actor-1');

    const passwordEvent = auditRecord.mock.calls.find(
      (call) => (call[0] as { changedFields?: string[] }).changedFields?.includes('password'),
    );
    expect(passwordEvent).toBeDefined();
    const entry = passwordEvent![0] as Record<string, unknown>;
    expect(entry.before).toBeUndefined();
    expect(entry.after).toBeUndefined();
    expect(entry.changedFields).toEqual(['password']);
    expect(JSON.stringify(entry)).not.toContain('new-plaintext-password');
  });

  it('labels the reason as self-service vs admin reset based on actor', async () => {
    await userService.update('u1', { password: 'x' }, 'u1');
    const selfServiceEntry = auditRecord.mock.calls.at(-1)![0] as { reason?: string };
    expect(selfServiceEntry.reason).toBe('self-service password change');

    await userService.update('u1', { password: 'x' }, 'someone-else');
    const adminEntry = auditRecord.mock.calls.at(-1)![0] as { reason?: string };
    expect(adminEntry.reason).toBe('admin password reset');
  });

  it('does not emit a password-changed event when password is not part of the patch', async () => {
    await userService.update('u1', { firstName: 'New' }, 'actor-1');
    const passwordEvent = auditRecord.mock.calls.find(
      (call) => (call[0] as { changedFields?: string[] }).changedFields?.includes('password'),
    );
    expect(passwordEvent).toBeUndefined();
  });
});
