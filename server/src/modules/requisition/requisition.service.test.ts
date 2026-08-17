import { describe, it, expect, vi } from 'vitest';
import { createRequisitionService } from './requisition.service';
import type { RequisitionRepo, RequisitionDto } from '@/modules/requisition/requisition.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { PatientRepo, PatientDto } from '@/modules/patient/patient.repository';
import type { SelectableUnit } from '@/shared/compatibility/fefo';
import type { CrossmatchService } from '@/modules/crossmatch/crossmatch.service';
import type { IssueService } from '@/modules/issue/issue.service';

vi.mock('@/modules/issue/issue.model', () => ({
  IssueModel: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

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

// FEFO drops any unit whose expiresAt is at or before `now`
// (shared/compatibility/fefo.ts). A hard-coded date silently turns these
// tests into a time bomb that starts failing on that date, so keep the
// default relative to the run.
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function releasedUnit(
  id: string,
  abo: 'A' | 'O' = 'A',
  expiresAt = new Date(Date.now() + THIRTY_DAYS_MS),
): SelectableUnit {
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
    purpose: 'REQUISITION',
    requestedComponents: [
      { componentType: 'PRBC', units: 2, aboGroup: 'A', rhFactor: 'POSITIVE', urgency: 'ROUTINE' },
    ],
    matchedUnits: [],
    status: 'PENDING',
    createdAt: '2026-05-30T00:00:00Z',
    ...over,
  };
}

function deps(opts: { candidates?: SelectableUnit[]; pat?: PatientDto; req?: RequisitionDto }) {
  const units: UnitRepo = {
    findByUnitId: vi.fn(),
    findReleasableByDonation: vi.fn(),
    applyEvent: vi.fn().mockResolvedValue({ status: 'RESERVED' }),
    applyEventToDonation: vi.fn(),
    selectable: vi.fn().mockResolvedValue(opts.candidates ?? []),
    inStockSummary: vi.fn(),
    findExpiredUnitIds: vi.fn(),
    findNearExpiry: vi.fn(),
    findBestReplacement: vi.fn(),
    allIssued: vi.fn(),
    findDonationsWithIssuedUnit: vi.fn(),
    availableForSelection: vi.fn().mockResolvedValue([]),
  };
  const requisitions: RequisitionRepo = {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    create: vi.fn().mockResolvedValue(opts.req ?? reqDto()),
    findById: vi.fn().mockResolvedValue(opts.req ?? reqDto()),
    updateDetails: vi.fn(),
    setMatched: vi
      .fn()
      .mockImplementation(async (_id, matched) =>
        reqDto({ matchedUnits: matched, status: 'MATCHED' }),
      ),
    setCrossmatchStatus: vi.fn(),
    setStatus: vi.fn(),
    reject: vi.fn().mockResolvedValue(reqDto({ status: 'REJECTED' })),
    removeMatchedUnit: vi.fn(),
    pushMatchedUnit: vi.fn(),
    swapMatchedUnit: vi.fn(),
    markReserved: vi.fn().mockImplementation(async () => reqDto()),
    markUnreserved: vi.fn().mockImplementation(async () => reqDto()),
    setRecipientGrouping: vi.fn(),
    setMatchedUnitGrouping: vi.fn(),
    setMatchedUnitCompatibilityConfirmed: vi.fn(),
    setComponentStatus: vi.fn().mockImplementation(async () => reqDto()),
    removeMatchedUnitsByComponent: vi.fn().mockImplementation(async () => reqDto()),
    pushRejectedUnit: vi.fn().mockImplementation(async () => reqDto()),
  };
  const patients: PatientRepo = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(opts.pat ?? patient()),
    updateSnapshot: vi.fn(),
  };
  const crossmatch: CrossmatchService = {
    perform: vi.fn().mockResolvedValue(undefined),
  };
  const issue: IssueService = {
    issue: vi.fn(),
  };
  return { units, requisitions, patients, crossmatch, issue };
}

describe('requisition-service.match', () => {
  it('reserves 2 compatible units at match time', async () => {
    const d = deps({ candidates: [releasedUnit('U1'), releasedUnit('U2'), releasedUnit('U3')] });
    const svc = createRequisitionService(d);
    const { requisition, shortages } = await svc.match(REQ_ID, 'actor');
    // Reservation now happens right at match time, not deferred to approve.
    expect(d.units.applyEvent).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'U1', event: 'RESERVE' }),
    );
    expect(d.units.applyEvent).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'U2', event: 'RESERVE' }),
    );
    expect(requisition.matchedUnits).toHaveLength(2);
    expect(requisition.matchedUnits[0]!.reserved).toBe(true);
    expect(shortages).toHaveLength(0);
    expect(requisition.matchedUnits[0]!.crossmatchRequired).toBe(true);
    expect(requisition.matchedUnits[0]!.crossmatchStatus).toBe('PENDING');
  });

  it('approve no longer reserves — units are already reserved from match', async () => {
    // Approval-ready: crossmatch compatible (the readiness gate blocks
    // approve otherwise). Unit is already reserved (from match), so approve
    // should just commit the crossmatch and flip status, not call RESERVE.
    const matchedUnits = [
      {
        unitId: 'U1',
        componentType: 'PRBC' as const,
        compatibilityType: 'EXACT' as const,
        reserved: true,
        crossmatchRequired: true,
        crossmatchStatus: 'COMPATIBLE' as const,
      },
    ];
    const d = deps({
      req: reqDto({ status: 'MATCHED', matchedUnits }),
    });
    d.units.applyEvent = vi.fn().mockResolvedValue({ status: 'RESERVED' });
    d.requisitions.setStatus = vi.fn().mockResolvedValue(reqDto({ status: 'APPROVED' }));
    const svc = createRequisitionService(d);
    await svc.approve(REQ_ID, 'actor');
    expect(d.units.applyEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: 'RESERVE' }),
    );
    expect(d.requisitions.setStatus).toHaveBeenCalledWith(REQ_ID, 'APPROVED', 'actor');
  });

  it('refuses to approve until the crossmatch worksheet is recorded', async () => {
    const matchedUnits = [
      {
        unitId: 'U1',
        componentType: 'PRBC' as const,
        compatibilityType: 'EXACT' as const,
        reserved: false,
        crossmatchRequired: true,
        crossmatchStatus: 'PENDING' as const,
      },
    ];
    const d = deps({ req: reqDto({ status: 'MATCHED', matchedUnits }) });
    const svc = createRequisitionService(d);
    await expect(svc.approve(REQ_ID, 'actor')).rejects.toThrow(
      /complete the crossmatch/i,
    );
    // Nothing reserved — the gate short-circuits before touching inventory.
    expect(d.units.applyEvent).not.toHaveBeenCalled();
  });

  it('reports a shortage when not enough compatible units', async () => {
    const d = deps({ candidates: [releasedUnit('U1')] });
    const svc = createRequisitionService(d);
    const { requisition, shortages } = await svc.match(REQ_ID, 'actor');
    expect(requisition.matchedUnits).toHaveLength(1);
    expect(shortages).toEqual([
      {
        componentType: 'PRBC',
        bloodGroup: 'A',
        rh: 'Positive',
        required: 2,
        available: 1,
        compatibleGroupsSearched: ['A'],
        specialNeeds: [],
      },
    ]);
  });

  it('marks O-unit-for-A-patient as COMPATIBLE not EXACT', async () => {
    const d = deps({ candidates: [releasedUnit('U1', 'O')] });
    const svc = createRequisitionService(d);
    const { requisition } = await svc.match(REQ_ID, 'actor');
    expect(requisition.matchedUnits[0]!.compatibilityType).toBe('COMPATIBLE');
  });

  it('refuses to match a rejected requisition', async () => {
    const d = deps({ req: reqDto({ status: 'REJECTED' }) });
    const svc = createRequisitionService(d);
    await expect(svc.match(REQ_ID, 'actor')).rejects.toThrow();
  });

  it('re-matching an already-ISSUED requisition (Edit adding bags) preserves its status', async () => {
    // e.g. Step 1 of Edit increases a component's requested units after
    // approval/issue — the shortfall must still get matched+reserved, and
    // the requisition must NOT regress from ISSUED back to MATCHED.
    const d = deps({
      req: reqDto({ status: 'ISSUED' }),
      candidates: [releasedUnit('U1'), releasedUnit('U2')],
    });
    const svc = createRequisitionService(d);
    await svc.match(REQ_ID, 'actor');
    expect(d.requisitions.setMatched).toHaveBeenCalledWith(
      REQ_ID,
      expect.any(Array),
      'actor',
      'ISSUED',
    );
  });
});

describe('requisition-service.reject', () => {
  it('unreserves all matched units and clears reservation/issuance fields', async () => {
    const d = deps({
      req: reqDto({
        status: 'APPROVED',
        matchedUnits: [
          {
            unitId: 'U1',
            componentType: 'PRBC',
            compatibilityType: 'EXACT',
            crossmatchRequired: true,
            crossmatchStatus: 'COMPATIBLE',
          },
          {
            unitId: 'U2',
            componentType: 'PRBC',
            compatibilityType: 'EXACT',
            crossmatchRequired: true,
            crossmatchStatus: 'COMPATIBLE',
          },
        ],
      }),
    });
    const svc = createRequisitionService(d);
    await svc.reject(REQ_ID, 'Patient discharged', 'actor');
    expect(d.units.applyEvent).toHaveBeenCalledTimes(2);
    expect(d.units.applyEvent).toHaveBeenNthCalledWith(1, {
      unitId: 'U1',
      event: 'UNRESERVE',
      actorId: 'actor',
      reason: 'Requisition RQ-1 rejected',
      set: {
        reservedFor: null,
        reservedAt: null,
        reservedUntil: null,
        issuedAt: null,
        issuedTo: null,
      },
    });
  });
});

describe('requisition-service.unissueUnits', () => {
  it('reverts an issued unit one step back to RESERVED, not removed from the requisition', async () => {
    const matchedUnits = [
      {
        unitId: 'U1',
        componentType: 'PRBC' as const,
        compatibilityType: 'EXACT' as const,
        reserved: true,
        crossmatchRequired: true,
        crossmatchStatus: 'COMPATIBLE' as const,
      },
    ];
    const d = deps({ req: reqDto({ status: 'COMPLETED', matchedUnits }) });
    d.units.findByUnitId = vi.fn().mockResolvedValue({ unitId: 'U1', status: 'ISSUED' });
    d.units.applyEvent = vi.fn().mockResolvedValue({ status: 'RESERVED' });
    d.requisitions.markReserved = vi
      .fn()
      .mockResolvedValue(reqDto({ status: 'COMPLETED', matchedUnits }));
    d.requisitions.setStatus = vi.fn().mockResolvedValue(reqDto({ status: 'APPROVED', matchedUnits }));
    const svc = createRequisitionService(d);

    const updated = await svc.unissueUnits(REQ_ID, ['U1'], 'Issued by mistake', 'actor');

    expect(d.units.applyEvent).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'U1', event: 'UNISSUE' }),
    );
    // Never dropped from the requisition — markReserved (not removeMatchedUnit)
    // is what puts it back, so it stays listed under the same request.
    expect(d.requisitions.markReserved).toHaveBeenCalledWith(REQ_ID, 'U1', 'actor');
    // A fully-issued requisition reverts to APPROVED so Issue stays reachable.
    expect(d.requisitions.setStatus).toHaveBeenCalledWith(REQ_ID, 'APPROVED', 'actor');
    expect(updated.status).toBe('APPROVED');
  });

  it('refuses to unissue a unit that is not currently issued', async () => {
    const matchedUnits = [
      {
        unitId: 'U1',
        componentType: 'PRBC' as const,
        compatibilityType: 'EXACT' as const,
        reserved: true,
        crossmatchRequired: true,
        crossmatchStatus: 'COMPATIBLE' as const,
      },
    ];
    const d = deps({ req: reqDto({ status: 'APPROVED', matchedUnits }) });
    d.units.findByUnitId = vi.fn().mockResolvedValue({ unitId: 'U1', status: 'RESERVED' });
    const svc = createRequisitionService(d);
    await expect(svc.unissueUnits(REQ_ID, ['U1'], 'reason', 'actor')).rejects.toThrow(
      /not currently issued/i,
    );
  });
});

describe('requisition-service.swapMatchedUnit', () => {
  it('swaps a bag even though it is already RESERVED (reservation now happens at match time)', async () => {
    const matchedUnits = [
      {
        unitId: 'U1',
        componentType: 'PRBC' as const,
        compatibilityType: 'EXACT' as const,
        reserved: true,
        crossmatchRequired: true,
        crossmatchStatus: 'PENDING' as const,
      },
    ];
    const d = deps({ req: reqDto({ status: 'MATCHED', matchedUnits }) });
    d.units.findByUnitId = vi.fn().mockImplementation(async (unitId: string) => {
      if (unitId === 'U1') return { unitId: 'U1', status: 'RESERVED', componentType: 'PRBC' };
      if (unitId === 'U2') {
        return releasedUnit('U2');
      }
      return null;
    });
    d.units.applyEvent = vi.fn().mockResolvedValue({ status: 'RESERVED' });
    d.requisitions.swapMatchedUnit = vi.fn().mockResolvedValue(reqDto());
    const svc = createRequisitionService(d);

    await svc.swapMatchedUnit(REQ_ID, 'U1', 'U2', 'actor');

    // Outgoing bag released, incoming bag reserved.
    expect(d.units.applyEvent).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'U1', event: 'UNRESERVE' }),
    );
    expect(d.units.applyEvent).toHaveBeenCalledWith(
      expect.objectContaining({ unitId: 'U2', event: 'RESERVE' }),
    );
    expect(d.requisitions.swapMatchedUnit).toHaveBeenCalledWith(
      REQ_ID,
      'U1',
      expect.objectContaining({ unitId: 'U2', reserved: true }),
    );
  });

  it('refuses to swap a bag that has already been issued', async () => {
    const matchedUnits = [
      {
        unitId: 'U1',
        componentType: 'PRBC' as const,
        compatibilityType: 'EXACT' as const,
        reserved: true,
        crossmatchRequired: true,
        crossmatchStatus: 'PENDING' as const,
      },
    ];
    const d = deps({ req: reqDto({ status: 'MATCHED', matchedUnits }) });
    d.units.findByUnitId = vi.fn().mockResolvedValue({ unitId: 'U1', status: 'ISSUED' });
    const svc = createRequisitionService(d);
    await expect(svc.swapMatchedUnit(REQ_ID, 'U1', 'U2', 'actor')).rejects.toThrow(/issued/i);
  });
});

describe('requisition-service.complete', () => {
  it('does NOT automatically issue unissued matched units upon completing the requisition', async () => {
    const d = deps({
      req: reqDto({
        status: 'APPROVED',
        matchedUnits: [
          {
            unitId: 'U1',
            componentType: 'PRBC',
            compatibilityType: 'EXACT',
            crossmatchRequired: true,
            crossmatchStatus: 'COMPATIBLE',
          },
        ],
      }),
    });
    d.units.findByUnitId = vi.fn().mockResolvedValue({
      unitId: 'U1',
      status: 'RESERVED',
      componentType: 'PRBC',
    });
    const svc = createRequisitionService(d);
    await svc.complete(REQ_ID, 'actor');

    expect(d.units.applyEvent).not.toHaveBeenCalled();
    expect(d.requisitions.setStatus).toHaveBeenCalledWith(REQ_ID, 'COMPLETED', 'actor');
  });
});
