import { describe, it, expect, vi } from 'vitest';
import { createDonorService } from './donor.service';
import type { DonorRepo, DonorDto } from '@/modules/donor/donor.repository';
import { ConflictError } from '@/shared/errors';

function baseDonor(): Parameters<DonorRepo['create']>[0] {
  return {
    name: { firstName: 'Asha', middleName: 'Devi', lastName: 'Patil' },
    dob: new Date('2000-01-01'),
    sex: 'F',
    phone: '9876543210',
    address: { city: 'Pune', district: 'Pune', state: 'MH' },
    weightKg: 55,
    bloodGroup: 'A',
    rh: 'Positive',
  };
}

function mockRepo(overrides: Partial<DonorRepo> = {}): DonorRepo {
  const dto: DonorDto = {
    id: 'mock-id',
    name: { firstName: 'Asha', lastName: 'Patil' },
    dob: '2000-01-01T00:00:00.000Z',
    sex: 'F',
    phone: '9876543210',
    address: { city: 'Pune', district: 'Pune', state: 'MH' },
    weightKg: 55,
    bloodGroup: 'A',
    rh: 'Positive',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  return {
    create: vi.fn().mockResolvedValue(dto),
    findById: vi.fn().mockResolvedValue(dto),
    update: vi.fn().mockResolvedValue(dto),
    list: vi.fn().mockResolvedValue({ items: [dto], total: 1 }),
    softDelete: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    findActiveByPhone: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('donor-service.register', () => {
  it('creates a donor when inputs are valid', async () => {
    const repo = mockRepo();
    const svc = createDonorService({ repo });
    const result = await svc.register(baseDonor(), 'actor-id');
    expect(repo.create).toHaveBeenCalledOnce();
    expect(result.id).toBe('mock-id');
  });

  it('rejects underweight donors', async () => {
    const repo = mockRepo();
    const svc = createDonorService({ repo });
    await expect(svc.register({ ...baseDonor(), weightKg: 40 }, 'a')).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects under-age donors', async () => {
    const repo = mockRepo();
    const svc = createDonorService({ repo });
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 16);
    await expect(svc.register({ ...baseDonor(), dob }, 'a')).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects over-age donors', async () => {
    const repo = mockRepo();
    const svc = createDonorService({ repo });
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 70);
    await expect(svc.register({ ...baseDonor(), dob }, 'a')).rejects.toBeInstanceOf(ConflictError);
  });

  it('allows registration even when the phone is already used by another donor', async () => {
    const repo = mockRepo({
      findActiveByPhone: vi
        .fn()
        .mockResolvedValue({ id: 'existing', phone: '9876543210' } as DonorDto),
    });
    const svc = createDonorService({ repo });
    await expect(svc.register(baseDonor(), 'a')).resolves.toBeDefined();
    expect(repo.create).toHaveBeenCalled();
  });
});
