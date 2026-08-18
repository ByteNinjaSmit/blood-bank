import { describe, it, expect, vi } from 'vitest';
import { createDonationService } from './donation.service';
import type { DonationRepo, DonationWithUnitsDto } from '@/modules/donation/donation.repository';
import type { DonorRepo, DonorDto } from '@/modules/donor/donor.repository';
import type { DeferralRepo } from '@/modules/deferral/deferral.repository';
import { ConflictError, NotFoundError } from '@/shared/errors';
import type { CreateDonationInput } from '@/modules/donation/donation.validator';

function mockDeferrals(
  active: Awaited<ReturnType<DeferralRepo['findActiveByDonor']>> = [],
): DeferralRepo {
  return {
    create: vi.fn(),
    findActiveByDonor: vi.fn().mockResolvedValue(active),
    findLatestActiveByDonor: vi.fn().mockResolvedValue(null),
    listByDonor: vi.fn(),
    list: vi.fn(),
    lift: vi.fn(),
    findByRelatedDonation: vi.fn(),
  };
}

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
    softDelete: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    findActiveByPhone: vi.fn(),
  };
}

function mockDonations(): DonationRepo {
  return {
    createAtomic: vi.fn().mockImplementation(
      async (c: Parameters<DonationRepo['createAtomic']>[0]): Promise<DonationWithUnitsDto> => ({
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
    findByDonationId: vi.fn(),
    findRawStatus: vi.fn(),
    list: vi.fn(),
    findLatestByDonor: vi.fn().mockResolvedValue(null),
    softDelete: vi.fn(),
    restore: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    lookupByBagNo: vi.fn(),
    bagNosByDonationIds: vi.fn().mockResolvedValue({}),
    createInwardAtomic: vi.fn(),
    findInwardState: vi.fn(),
    setDonor: vi.fn(),
    setMedicalHistory: vi.fn(),
    setCompletionStatus: vi.fn(),
    listIncomplete: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  };
}

describe('donation-service.register', () => {
  it('registers a fit whole-blood donation and derives 1 WB unit', async () => {
    const svc = createDonationService({
      donations: mockDonations(),
      donors: mockDonors(),
      deferrals: mockDeferrals(),
    });
    const result = await svc.register(baseInput(), 'actor-id');
    expect(result.units).toHaveLength(1);
    expect(result.units.map((u) => u.componentType).sort()).toEqual(['WB']);
    expect(result.ttiReleaseDecision).toBe('pending');
  });

  it('records an unfit donation with zero units', async () => {
    const svc = createDonationService({
      donations: mockDonations(),
      donors: mockDonors(),
      deferrals: mockDeferrals(),
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
      deferrals: mockDeferrals(),
    });
    await expect(svc.register(baseInput(), 'actor-id')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('registers a fit donation even when eligibility checks fail (low Hb)', async () => {
    const svc = createDonationService({
      donations: mockDonations(),
      donors: mockDonors(),
      deferrals: mockDeferrals(),
    });
    const result = await svc.register(
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
    );
    expect(result.units).toHaveLength(1);
  });

  it('rejects too-soon repeat WB donation (under 90 days for male)', async () => {
    const donations = mockDonations();
    donations.findLatestByDonor = vi.fn().mockResolvedValue({
      collectedAt: new Date('2026-04-01T00:00:00Z'),
      donationType: 'WHOLE_BLOOD',
    });
    const svc = createDonationService({
      donations,
      donors: mockDonors(),
      deferrals: mockDeferrals(),
    });
    await expect(svc.register(baseInput(), 'actor-id')).rejects.toThrowError(
      /Donor cannot donate yet/,
    );
  });

  it('rejects too-soon repeat WB donation (under 120 days for female)', async () => {
    const donations = mockDonations();
    donations.findLatestByDonor = vi.fn().mockResolvedValue({
      collectedAt: new Date('2026-04-01T00:00:00Z'),
      donationType: 'WHOLE_BLOOD',
    });
    const femaleDonor = { ...donorMatchingMinimum, sex: 'F' as const };
    const svc = createDonationService({
      donations,
      donors: mockDonors(femaleDonor),
      deferrals: mockDeferrals(),
    });
    await expect(svc.register(baseInput(), 'actor-id')).rejects.toThrowError(
      /Donor cannot donate yet/,
    );
  });

  it('accepts repeat WB donation after required interval (90 days for male)', async () => {
    const donations = mockDonations();
    donations.findLatestByDonor = vi.fn().mockResolvedValue({
      collectedAt: new Date('2026-02-01T00:00:00Z'),
      donationType: 'WHOLE_BLOOD',
    });
    const svc = createDonationService({
      donations,
      donors: mockDonors(),
      deferrals: mockDeferrals(),
    });
    const result = await svc.register(baseInput(), 'actor-id');
    expect(result.units).toHaveLength(1);
  });

  it('accepts repeat WB donation after required interval (120 days for female)', async () => {
    const donations = mockDonations();
    donations.findLatestByDonor = vi.fn().mockResolvedValue({
      collectedAt: new Date('2026-01-01T00:00:00Z'),
      donationType: 'WHOLE_BLOOD',
    });
    const femaleDonor = { ...donorMatchingMinimum, sex: 'F' as const };
    const svc = createDonationService({
      donations,
      donors: mockDonors(femaleDonor),
      deferrals: mockDeferrals(),
    });
    const result = await svc.register(baseInput(), 'actor-id');
    expect(result.units).toHaveLength(1);
  });

  it('registers a fit donation even when donor has active permanent deferral', async () => {
    const svc = createDonationService({
      donations: mockDonations(),
      donors: mockDonors(),
      deferrals: mockDeferrals([{ type: 'PERMANENT', reason: 'Anti-HCV reactive' }]),
    });
    const result = await svc.register(baseInput(), 'actor-id');
    expect(result.units).toHaveLength(1);
  });
});
