import { describe, it, expect, vi } from 'vitest';
import { createTtiService, assertTtiReleased } from './tti.service';
import { TtiQuarantineViolation } from '@/shared/errors';
import { MANDATORY_PANEL } from './tti.release-rules';
import type { TtiRepo, TtiResultDto } from '@/modules/tti/tti.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { DeferralRepo } from '@/modules/deferral/deferral.repository';
import type { DonationRepo } from '@/modules/donation/donation.repository';

function ttiWith(
  tests: TtiResultDto['tests'],
  releaseDecision: TtiResultDto['releaseDecision'] = 'pending',
): TtiResultDto {
  return {
    id: 'tti-1',
    donationId: 'DN-1',
    tests,
    releaseDecision,
  };
}

function negativePanel(): TtiResultDto['tests'] {
  return MANDATORY_PANEL.map((testName) => ({
    testName,
    method: 'ELISA',
    result: 'NEGATIVE',
    performedAt: '2026-05-30T00:00:00Z',
  }));
}

function mocks(ttiDto: TtiResultDto) {
  const tti: TtiRepo = {
    findByDonation: vi.fn().mockResolvedValue(ttiDto),
    resolveByIdOrDonation: vi.fn().mockResolvedValue(ttiDto),
    recordTests: vi.fn().mockResolvedValue(ttiDto),
    setDecision: vi.fn().mockResolvedValue(ttiDto),
    setEditMeta: vi.fn().mockResolvedValue(ttiDto),
    countPendingTesting: vi.fn().mockResolvedValue(0),
  };
  const units: UnitRepo = {
    findByUnitId: vi.fn(),
    findReleasableByDonation: vi.fn(),
    applyEvent: vi.fn(),
    applyEventToDonation: vi.fn().mockResolvedValue(3),
    selectable: vi.fn(),
    inStockSummary: vi.fn(),
    findExpiredUnitIds: vi.fn(),
    findNearExpiry: vi.fn(),
    findBestReplacement: vi.fn(),
    allIssued: vi.fn(),
    findDonationsWithIssuedUnit: vi.fn(),
    availableForSelection: vi.fn().mockResolvedValue([]),
  };
  const deferrals: DeferralRepo = {
    create: vi.fn(),
    findActiveByDonor: vi.fn(),
    findLatestActiveByDonor: vi.fn().mockResolvedValue(null),
    listByDonor: vi.fn(),
    list: vi.fn(),
    lift: vi.fn(),
    findByRelatedDonation: vi.fn().mockResolvedValue(null),
  };
  const donations = {
    findByDonationId: vi.fn().mockResolvedValue({ donor: 'donor-1' }),
  } as unknown as DonationRepo;
  return { tti, units, deferrals, donations };
}

describe('tti-service.finalize', () => {
  it('all-negative panel releases units through legal state chain', async () => {
    const m = mocks(ttiWith(negativePanel()));
    const svc = createTtiService(m);
    const r = await svc.finalize('DN-1', 'actor');
    expect(r.decision).toBe('released');
    // BEGIN_TESTING, AWAIT_TTI, RELEASE — three transition calls.
    expect(m.units.applyEventToDonation).toHaveBeenCalledTimes(3);
    expect(m.units.applyEventToDonation).toHaveBeenNthCalledWith(
      1,
      'DN-1',
      'BEGIN_TESTING',
      'actor',
      ['COLLECTED'],
      undefined,
      { requestId: undefined },
    );
    expect(m.units.applyEventToDonation).toHaveBeenNthCalledWith(
      3,
      'DN-1',
      'RELEASE',
      'actor',
      ['QUARANTINE'],
      undefined,
      { requestId: undefined, set: { quarantineReason: null } },
    );
    expect(m.deferrals.create).not.toHaveBeenCalled();
  });

  it('reactive panel discards units and permanently defers donor', async () => {
    const panel = negativePanel();
    panel[0] = { ...panel[0]!, result: 'REACTIVE' };
    const m = mocks(ttiWith(panel));
    const svc = createTtiService(m);
    const r = await svc.finalize('DN-1', 'actor');
    expect(r.decision).toBe('reactive');
    expect(m.units.applyEventToDonation).toHaveBeenCalledWith(
      'DN-1',
      'DISCARD',
      'actor',
      expect.arrayContaining(['RELEASED', 'QUARANTINE']),
      expect.any(String),
      { set: { discardReason: 'TTI_POSITIVE' } },
    );
    expect(m.deferrals.create).toHaveBeenCalledOnce();
    const deferralArg = (m.deferrals.create as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(deferralArg.type).toBe('PERMANENT');
    expect(deferralArg.source).toBe('TTI_REACTIVE');
  });

  it('correcting a reactive result to released reinstates units and lifts the deferral', async () => {
    const m = mocks(ttiWith(negativePanel(), 'reactive'));
    (m.deferrals.findByRelatedDonation as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'def-1',
      donor: 'donor-1',
      type: 'PERMANENT',
      reason: 'TTI reactive: HIV',
      source: 'TTI_REACTIVE',
      createdAt: '2026-05-30T00:00:00Z',
    });
    const svc = createTtiService(m);
    const r = await svc.finalize('DN-1', 'actor');
    expect(r.decision).toBe('released');
    expect(m.units.applyEventToDonation).toHaveBeenCalledWith(
      'DN-1',
      'REINSTATE',
      'actor',
      ['DISCARDED'],
      expect.any(String),
      { match: { discardReason: 'TTI_POSITIVE' }, set: { discardReason: null } },
    );
    expect(m.deferrals.findByRelatedDonation).toHaveBeenCalledWith('DN-1', 'TTI_REACTIVE');
    expect(m.deferrals.lift).toHaveBeenCalledWith('def-1', 'actor', expect.any(String));
  });

  it('incomplete panel stays pending, no unit movement', async () => {
    const m = mocks(ttiWith(negativePanel().slice(0, 2)));
    const svc = createTtiService(m);
    const r = await svc.finalize('DN-1', 'actor');
    expect(r.decision).toBe('pending');
    expect(m.units.applyEventToDonation).not.toHaveBeenCalled();
  });
});

describe('assertTtiReleased guard', () => {
  it('passes when released', () => {
    expect(() => assertTtiReleased('released', 'DN-1')).not.toThrow();
  });
  it('throws TtiQuarantineViolation otherwise', () => {
    expect(() => assertTtiReleased('pending', 'DN-1')).toThrow(TtiQuarantineViolation);
    expect(() => assertTtiReleased('reactive', 'DN-1')).toThrow(TtiQuarantineViolation);
  });
});
