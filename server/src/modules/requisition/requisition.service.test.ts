import { describe, it, expect, vi } from 'vitest';
import { createRequisitionService } from './requisition.service';
import type { RequisitionRepo, RequisitionDto } from '@/modules/requisition/requisition.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { PatientRepo, PatientDto } from '@/modules/patient/patient.repository';
import type { SelectableUnit } from '@/shared/compatibility/fefo';

const REQ_ID = '507f1f77bcf86cd799439011';

function patient(over: Partial<PatientDto> = {}): PatientDto {
  return {
    id: 'pat-1',
    patientPublicId: 'P-1',
    name: 'Test',
    aboGroup: 'A',
    rhFactor: 'POSITIVE',
    groupConfirmationCount: 2,
    antibodies: [],
    specialNeeds: [],
    ...over,
  };
}

function releasedUnit(id: string, abo: 'A' | 'O' = 'A', expiresAt = new Date('2026-08-01')): SelectableUnit {
  return {
    unitId: id,
    componentType: 'PRBC',
    aboGroup: abo,
    rhFactor: 'POSITIVE',
    expiresAt,
    specialAttributes: new Set(),
    status: 'RELEASED',
  };
}

function reqDto(over: Partial<RequisitionDto> = {}): RequisitionDto {
  return {
    id: REQ_ID,
    requisitionId: 'RQ-1',
    hospitalId: 'hosp-1',
    patientId: 'pat-1',
    clinicianName: 'Dr Who',
    requestedComponents: [
      { componentType: 'PRBC', units: 2, aboGroup: 'A', rhFactor: 'POSITIVE', urgency: 'ROUTINE' },
    ],
    matchedUnits: [],
    status: 'PENDING',
    createdAt: '2026-05-30T00:00:00Z',
    ...over,
  };
}

function deps(opts: {
  candidates?: SelectableUnit[];
  pat?: PatientDto;
  req?: RequisitionDto;
}) {
  const units: UnitRepo = {
    findByUnitId: vi.fn(),
    findReleasableByDonation: vi.fn(),
    applyEvent: vi.fn().mockResolvedValue({ status: 'RESERVED' }),
    applyEventToDonation: vi.fn(),
    selectable: vi.fn().mockResolvedValue(opts.candidates ?? []),
    inStockSummary: vi.fn(),
    findExpiredUnitIds: vi.fn(),
    findNearExpiry: vi.fn(),
  };
  const requisitions: RequisitionRepo = {
    create: vi.fn().mockResolvedValue(opts.req ?? reqDto()),
    findById: vi.fn().mockResolvedValue(opts.req ?? reqDto()),
    setMatched: vi.fn().mockImplementation(async (_id, matched) => reqDto({ matchedUnits: matched, status: 'MATCHED' })),
    setCrossmatchStatus: vi.fn(),
    setStatus: vi.fn(),
    reject: vi.fn().mockResolvedValue(reqDto({ status: 'REJECTED' })),
  };
  const patients: PatientRepo = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(opts.pat ?? patient()),
  };
  return { units, requisitions, patients };
}

describe('requisition-service.match', () => {
  it('reserves 2 compatible units and records them', async () => {
    const d = deps({ candidates: [releasedUnit('U1'), releasedUnit('U2'), releasedUnit('U3')] });
    const svc = createRequisitionService(d);
    const { requisition, shortages } = await svc.match(REQ_ID, 'actor');
    expect(d.units.applyEvent).toHaveBeenCalledTimes(2);
    expect(requisition.matchedUnits).toHaveLength(2);
    expect(Object.keys(shortages)).toHaveLength(0);
    expect(requisition.matchedUnits[0]!.crossmatchRequired).toBe(true);
    expect(requisition.matchedUnits[0]!.crossmatchStatus).toBe('PENDING');
  });

  it('reports a shortage when not enough compatible units', async () => {
    const d = deps({ candidates: [releasedUnit('U1')] });
    const svc = createRequisitionService(d);
    const { requisition, shortages } = await svc.match(REQ_ID, 'actor');
    expect(requisition.matchedUnits).toHaveLength(1);
    expect(shortages['PRBC-APOSITIVE']).toBe(1);
  });

  it('marks O-unit-for-A-patient as COMPATIBLE not EXACT', async () => {
    const d = deps({ candidates: [releasedUnit('U1', 'O')] });
    const svc = createRequisitionService(d);
    const { requisition } = await svc.match(REQ_ID, 'actor');
    expect(requisition.matchedUnits[0]!.compatibilityType).toBe('COMPATIBLE');
  });

  it('refuses to match a non-pending requisition', async () => {
    const d = deps({ req: reqDto({ status: 'ISSUED' }) });
    const svc = createRequisitionService(d);
    await expect(svc.match(REQ_ID, 'actor')).rejects.toThrow();
  });
});
