import { describe, it, expect, vi } from 'vitest';
import { createDonationService } from './donation-service';
import type { DonationRepo, DonationWithUnitsDto } from '@/infra/db/repositories/donation-repo';
import type { DonorRepo, DonorDto } from '@/infra/db/repositories/donor-repo';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { CreateDonationInput } from '@/http/validators/donation';

const donorMatchingMinimum: DonorDto = {
  id: '507f1f77bcf86cd799439011',
  name: { firstName: 'Asha', lastName: 'Patil' },
  dob: new Date('1995-01-01').toISOString(),
  sex: 'M',
  phone: '9876543210',
  address: { city: 'Pune', district: 'Pune', state: 'MH' },
  weightKg: 65,
  bloodGroup: 'A',
  rh: 'Positive',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function baseInput(over: Partial<CreateDonationInput> = {}): CreateDonationInput {
  return {
    donor: donorMatchingMinimum.id,
    donationType: 'WHOLE_BLOOD',
    collectedAt: new Date('2026-05-30T10:00:00Z'),
    donorFitness: { isFit: true },
    bloodGroup: 'A',
    rhFactor: 'POSITIVE',
    medicalExam: {
      weightKg: 65,
      hbGdl: 14,
      pulseBpm: 72,
      temperatureCelsius: 36.8,
      bloodPressure: { systolic: 120, diastolic: 80 },
    },
    ...over,
  };
}

function mockDonors(donor: DonorDto | null = donorMatchingMinimum): DonorRepo {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(donor),
    update: vi.fn(),
    list: vi.fn(),
    delete: vi.fn(),
    findActiveByPhone: vi.fn(),
  };
}

function mockDonations(): DonationRepo {
  return {
    createAtomic: vi.fn().mockImplementation(
      async (c): Promise<DonationWithUnitsDto> => ({
        id: 'don-id',
        donationId: c.donationPublicId,
        donor: c.input.donor,
        donationType: c.input.donationType,
        collectedAt: c.input.collectedAt.toISOString(),
        bloodGroup: c.input.bloodGroup,
        rhFactor: c.input.rhFactor,
        unitCount: c.units.length,
        createdAt: '2026-05-30T10:00:00Z',
        updatedAt: '2026-05-30T10:00:00Z',
        units: c.units.map((u) => ({
          unitId: u.unitId,
          componentType: u.componentType,
          volumeMl: u.volumeMl,
          expiresAt: u.expiresAt.toISOString(),
          status: 'COLLECTED',
        })),
        ttiResultId: 'tti-id',
        ttiReleaseDecision: 'pending',
      }),
    ),
    findById: vi.fn(),
    list: vi.fn(),
    findLatestByDonor: vi.fn().mockResolvedValue(null),
  };
}

describe('donation-service.register', () => {
  it('registers a fit whole-blood donation and derives 3 units (PRBC+FFP+PC)', async () => {
    const svc = createDonationService({
      donations: mockDonations(),
      donors: mockDonors(),
    });
    const result = await svc.register(baseInput(), 'actor-id');
    expect(result.units).toHaveLength(3);
    expect(result.units.map((u) => u.componentType).sort()).toEqual([
      'FFP',
      'PLATELET_CONCENTRATE',
      'PRBC',
    ]);
    expect(result.ttiReleaseDecision).toBe('pending');
  });

  it('records an unfit donation with zero units', async () => {
    const svc = createDonationService({
      donations: mockDonations(),
      donors: mockDonors(),
    });
    const result = await svc.register(
      baseInput({
        donorFitness: { isFit: false, rejectionReason: 'Donor refused' },
      }),
      'actor-id',
    );
    expect(result.unitCount).toBe(0);
    expect(result.units).toHaveLength(0);
  });

  it('throws NotFoundError when donor missing', async () => {
    const svc = createDonationService({
      donations: mockDonations(),
      donors: mockDonors(null),
    });
    await expect(svc.register(baseInput(), 'actor-id')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ConflictError when a fit donation fails eligibility (low Hb)', async () => {
    const svc = createDonationService({
      donations: mockDonations(),
      donors: mockDonors(),
    });
    await expect(
      svc.register(
        baseInput({
          medicalExam: {
            weightKg: 65,
            hbGdl: 10,
            pulseBpm: 72,
            temperatureCelsius: 36.8,
            bloodPressure: { systolic: 120, diastolic: 80 },
          },
        }),
        'actor-id',
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws ConflictError on too-soon repeat WB donation', async () => {
    const donations = mockDonations();
    donations.findLatestByDonor = vi.fn().mockResolvedValue({
      collectedAt: new Date('2026-04-01T00:00:00Z'),
      donationType: 'WHOLE_BLOOD',
    });
    const svc = createDonationService({ donations, donors: mockDonors() });
    await expect(svc.register(baseInput(), 'actor-id')).rejects.toBeInstanceOf(ConflictError);
  });
});
