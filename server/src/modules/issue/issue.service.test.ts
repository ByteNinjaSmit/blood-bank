import { describe, it, expect, vi } from 'vitest';
import { createIssueService } from './issue.service';
import { ForbiddenError } from '@/shared/errors';
import type { IssueRepo } from '@/modules/issue/issue.repository';
import type { RequisitionRepo, RequisitionDto } from '@/modules/requisition/requisition.repository';
import type { UnitRepo, UnitDto } from '@/modules/unit/unit.repository';
import type { PatientRepo, PatientDto } from '@/modules/patient/patient.repository';
import type { CrossmatchRepo, CrossmatchDto } from '@/modules/crossmatch/crossmatch.repository';
import type { TtiRepo, TtiResultDto } from '@/modules/tti/tti.repository';

const REQ_ID = '507f1f77bcf86cd799439011';

function reqDto(): RequisitionDto {
  return {
    id: REQ_ID,
    requisitionId: 'RQ-1',
    hospitalId: 'h',
    patientId: 'pat-1',
    clinicianName: 'Dr',
    requestedComponents: [],
    matchedUnits: [
      {
        unitId: 'U1',
        componentType: 'PRBC',
        compatibilityType: 'EXACT',
        crossmatchRequired: true,
        crossmatchStatus: 'COMPATIBLE',
      },
    ],
    status: 'CROSSMATCHED',
    createdAt: '2026-05-30T00:00:00Z',
  };
}

function unitDto(over: Partial<UnitDto> = {}): UnitDto {
  return {
    id: 'u-1',
    unitId: 'U1',
    unitDin: null,
    donationId: 'DN-1',
    componentType: 'PRBC',
    aboGroup: 'A',
    rhFactor: 'POSITIVE',
    volumeMl: 250,
    collectedAt: '2026-05-01T00:00:00Z',
    expiresAt: '2026-07-01T00:00:00Z',
    status: 'CROSSMATCHED',
    specialAttributes: [],
    storageLocation: null,
    clinicalIndicationPatient: null,
    ...over,
  };
}

function patientDto(over: Partial<PatientDto> = {}): PatientDto {
  return {
    id: 'pat-1',
    patientPublicId: 'P-1',
    name: 'T',
    aboGroup: 'A',
    rhFactor: 'POSITIVE',
    groupConfirmationCount: 2,
    antibodies: [],
    specialNeeds: [],
    ...over,
  };
}

function deps(opts: {
  unit?: UnitDto;
  patient?: PatientDto;
  tti?: TtiResultDto | null;
  xm?: CrossmatchDto | null;
}) {
  const issues: IssueRepo = {
    create: vi.fn().mockResolvedValue({ issueId: 'IS-1', unitId: 'U1' }),
  };
  const requisitions = {
    findById: vi.fn().mockResolvedValue(reqDto()),
  } as unknown as RequisitionRepo;
  const units: UnitRepo = {
    findByUnitId: vi.fn().mockResolvedValue(opts.unit ?? unitDto()),
    findReleasableByDonation: vi.fn(),
    applyEvent: vi.fn().mockResolvedValue(unitDto({ status: 'ISSUED' })),
    applyEventToDonation: vi.fn(),
    selectable: vi.fn(),
    inStockSummary: vi.fn(),
    findExpiredUnitIds: vi.fn(),
    findNearExpiry: vi.fn(),
    findBestReplacement: vi.fn(),
    allIssued: vi.fn(),
    findDonationsWithIssuedUnit: vi.fn(),
  };
  const patients: PatientRepo = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(opts.patient ?? patientDto()),
    updateSnapshot: vi.fn(),
  };
  const crossmatches = {
    record: vi.fn(),
    findLatestForUnit: vi
      .fn()
      .mockResolvedValue(
        opts.xm === undefined ? ({ result: 'COMPATIBLE' } as CrossmatchDto) : opts.xm,
      ),
  } as unknown as CrossmatchRepo;
  const tti = {
    findByDonation: vi
      .fn()
      .mockResolvedValue(
        opts.tti === undefined ? ({ releaseDecision: 'released' } as TtiResultDto) : opts.tti,
      ),
    recordTests: vi.fn(),
    setDecision: vi.fn(),
  } as unknown as TtiRepo;
  return { issues, requisitions, units, patients, crossmatches, tti };
}

describe('issue-service.issue', () => {
  it('issues when TTI released + crossmatch compatible + status CROSSMATCHED', async () => {
    const d = deps({});
    const svc = createIssueService(d);
    const r = await svc.issue({ requisitionId: REQ_ID, unitId: 'U1' }, 'actor');
    expect(r.issueId).toBe('IS-1');
    expect(d.units.applyEvent).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'U1', event: 'ISSUE' }),
    );
  });

  it('blocks issue when TTI not released', async () => {
    const d = deps({ tti: { id: 't', donationId: 'DN-1', tests: [], releaseDecision: 'pending' } });
    const svc = createIssueService(d);
    await expect(
      svc.issue({ requisitionId: REQ_ID, unitId: 'U1' }, 'actor'),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(d.units.applyEvent).not.toHaveBeenCalled();
  });

  it('blocks issue when crossmatch incompatible and no override', async () => {
    const d = deps({
      xm: {
        id: 'x',
        crossmatchId: 'XM',
        requisitionId: REQ_ID,
        unitId: 'U1',
        patientId: 'pat-1',
        method: 'AHG',
        result: 'INCOMPATIBLE',
        performedAt: '2026-05-30T00:00:00Z',
      },
    });
    const svc = createIssueService(d);
    await expect(
      svc.issue({ requisitionId: REQ_ID, unitId: 'U1' }, 'actor'),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('allows incompatible crossmatch WITH override reason', async () => {
    const d = deps({
      xm: {
        id: 'x',
        crossmatchId: 'XM',
        requisitionId: REQ_ID,
        unitId: 'U1',
        patientId: 'pat-1',
        method: 'AHG',
        result: 'INCOMPATIBLE',
        performedAt: '2026-05-30T00:00:00Z',
      },
    });
    const svc = createIssueService(d);
    const r = await svc.issue(
      { requisitionId: REQ_ID, unitId: 'U1', override: { reason: 'massive haemorrhage' } },
      'mo-actor',
    );
    expect(r.issueId).toBe('IS-1');
  });

  it('blocks when patient special need unmet, even with override', async () => {
    const d = deps({
      patient: patientDto({ specialNeeds: ['IRRADIATED'] }),
      unit: unitDto({ specialAttributes: [] }),
      xm: {
        id: 'x',
        crossmatchId: 'XM',
        requisitionId: REQ_ID,
        unitId: 'U1',
        patientId: 'pat-1',
        method: 'AHG',
        result: 'INCOMPATIBLE',
        performedAt: '2026-05-30T00:00:00Z',
      },
    });
    const svc = createIssueService(d);
    await expect(
      svc.issue(
        { requisitionId: REQ_ID, unitId: 'U1', override: { reason: 'emergency' } },
        'mo-actor',
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
