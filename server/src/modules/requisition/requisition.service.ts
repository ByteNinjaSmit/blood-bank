import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import type { IAuditService } from '@/shared/interfaces';
import { auditService as defaultAudit } from '@/modules/audit/audit.service';
import { selectUnits } from '@/shared/compatibility/fefo';
import { classify, requiresCrossmatch, compatibleAboGroups } from '@/shared/compatibility/abo-rh';
import type {
  CreateRequisitionInput,
  ListRequisitionsFilter,
  MatchedUnitDto,
  RequisitionDto,
  RequisitionRepo,
  UpdateRequisitionInput,
} from '@/modules/requisition/requisition.repository';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { PatientRepo } from '@/modules/patient/patient.repository';
import type { CrossmatchService } from '@/modules/crossmatch/crossmatch.service';
import type { IssueService } from '@/modules/issue/issue.service';
import { normalizeRequestedComponents, toLegacyComponentType } from '@/modules/requisition/requisition.mapper';

export interface MatchShortageDto {
  componentType: string;
  bloodGroup: string;
  rh: string;
  required: number;
  available: number;
  compatibleGroupsSearched: string[];
}

export interface MatchOutcome {
  requisition: RequisitionDto;
  /** Legacy-shaped shortages ready to serve to the client, empty when fully matched. */
  shortages: MatchShortageDto[];
  /** True when some (but not all) requested components were matched — 200 partial success rather than 409. */
  partial: boolean;
}

export interface UpdateCrossmatchLegacyInput {
  inventoryId: string;
  crossmatchStatus: 'compatible' | 'incompatible';
  compatibilityResult?: 'MAJOR_COMPATIBLE' | 'MINOR_COMPATIBLE' | 'UNIVERSAL';
  crossmatchDoneAt?: Date;
  crossmatchSeenAt?: Date;
  cardNumber?: string;
}

export interface RequisitionService {
  list(
    filter: ListRequisitionsFilter,
  ): Promise<{ items: RequisitionDto[]; total: number; page: number; pages: number }>;
  create(
    input: Omit<CreateRequisitionInput, 'requisitionId'>,
    actorId: string,
  ): Promise<RequisitionDto>;
  update(
    id: string,
    input: Omit<UpdateRequisitionInput, 'clinicianName'> & { clinicianName?: string },
    actorId: string,
  ): Promise<RequisitionDto>;
  match(id: string, actorId: string): Promise<MatchOutcome>;
  /** BBO/MO approves the matched + crossmatched requisition before issue. */
  approve(id: string, actorId: string): Promise<RequisitionDto>;
  /** Mark COMPLETED after all units in this requisition are transfused/returned. */
  complete(id: string, actorId: string): Promise<RequisitionDto>;
  get(id: string): Promise<RequisitionDto>;
  reject(id: string, reason: string, actorId: string): Promise<RequisitionDto>;
  setStatus(id: string, status: any, actorId: string): Promise<RequisitionDto>;
  /** Issues every matched unit (or a chosen subset), completing the requisition once all are out. */
  issueAll(
    id: string,
    unitIds: string[] | undefined,
    actorId: string,
  ): Promise<Array<{ issueId: string; unitId: string }>>;
  /** Legacy per-unit crossmatch update with auto-replacement on incompatible result. */
  updateCrossmatchLegacy(
    id: string,
    input: UpdateCrossmatchLegacyInput,
    actorId: string,
  ): Promise<RequisitionDto>;
}

export function createRequisitionService(deps: {
  requisitions: RequisitionRepo;
  units: UnitRepo;
  patients: PatientRepo;
  crossmatch: CrossmatchService;
  issue: IssueService;
  audit?: IAuditService;
}): RequisitionService {
  const log = childLogger({ module: 'requisition-service' });
  const audit = deps.audit ?? defaultAudit;

  return {
    async list(filter) {
      const { items, total } = await deps.requisitions.list(filter);
      return { items, total, page: filter.page, pages: Math.ceil(total / filter.limit) };
    },

    async create(input, actorId) {
      await deps.patients.findById(input.patientId);
      const requisitionId = `RQ-${dateStamp()}-${rand()}`;
      const created = await deps.requisitions.create({ ...input, requisitionId }, actorId);
      await audit.record({
        actorId,
        action: 'CREATE',
        entityType: 'Requisition',
        entityId: created.requisitionId,
        after: { patientId: input.patientId, status: 'PENDING' },
      });
      log.info({ requisitionId, patientId: input.patientId, actorId }, 'requisition created');
      return created;
    },

    async update(id, input, actorId) {
      const existing = await deps.requisitions.findById(id);

      if (input.patient) {
        let dob: Date | undefined;
        if (input.patient.age) {
          dob = new Date();
          dob.setFullYear(dob.getFullYear() - input.patient.age);
        }
        await deps.patients.updateSnapshot(existing.patientId, {
          name: input.patient.name,
          address: input.patient.address,
          dob,
          sex: input.patient.sex,
          medicalRecordNumber: input.patient.mrn,
          specialNeeds: input.patient.specialNeeds as any,
        });
      }

      const clinicianName = input.clinicianName || input.doctorName || '';
      const doctorName = input.doctorName || clinicianName;

      const updated = await deps.requisitions.updateDetails(
        id,
        { ...input, clinicianName, doctorName },
        actorId,
      );
      if (!updated) throw new NotFoundError('Requisition', id);
      return updated;
    },

    async match(id, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status !== 'PENDING' && req.status !== 'MATCHED') {
        throw new ConflictError(`Cannot match requisition in status ${req.status}`);
      }

      // Unreserve any existing matched units to prevent resource leaks
      if (Array.isArray(req.matchedUnits) && req.matchedUnits.length > 0) {
        for (const m of req.matchedUnits) {
          await deps.units
            .applyEvent({
              unitId: m.unitId,
              event: 'UNRESERVE',
              actorId,
              reason: `Unreserving previous match for re-matching requisition ${req.requisitionId}`,
              set: {
                reservedFor: null,
                reservedAt: null,
                reservedUntil: null,
              } as any,
            })
            .catch(() => undefined);
        }
      }

      const patient = await deps.patients.findById(req.patientId);

      const matched: MatchedUnitDto[] = [];
      const shortages: Record<string, number> = {};

      for (const rc of req.requestedComponents) {
        const aboGroups = [...compatibleAboGroups(rc.aboGroup, rc.componentType)];
        const candidates = await deps.units.selectable({
          componentType: rc.componentType,
          aboGroups,
        });
        const selection = selectUnits(candidates, {
          recipient: { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
          component: rc.componentType,
          specialNeeds: patient.specialNeeds,
          unitsRequired: rc.units,
        });

        if (selection.shortage > 0) {
          shortages[`${rc.componentType}-${rc.aboGroup}${rc.rhFactor}`] = selection.shortage;
        }

        const needsXm = requiresCrossmatch(rc.componentType);
        for (const sel of selection.selected) {
          await deps.units.applyEvent({
            unitId: sel.unit.unitId,
            event: 'RESERVE',
            actorId,
            reason: `Reserved for requisition ${req.requisitionId}`,
            set: { reservedFor: req.id, reservedAt: new Date() },
          });
          matched.push({
            unitId: sel.unit.unitId,
            componentType: rc.componentType,
            compatibilityType: classify(
              { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
              { aboGroup: sel.unit.aboGroup, rhFactor: sel.unit.rhFactor },
            ),
            crossmatchRequired: needsXm,
            crossmatchStatus: needsXm ? 'PENDING' : 'NOT_REQUIRED',
          });
        }
      }

      const updated = await deps.requisitions.setMatched(id, matched, actorId);
      log.info(
        { requisitionId: req.requisitionId, matched: matched.length, shortages },
        'requisition matched',
      );

      const shortageKeys = Object.keys(shortages);
      if (shortageKeys.length === 0) {
        return { requisition: updated, shortages: [], partial: false };
      }

      const formattedShortages: MatchShortageDto[] = [];
      for (const key of shortageKeys) {
        const rc = req.requestedComponents.find(
          (c) => key === `${c.componentType}-${c.aboGroup}${c.rhFactor}`,
        );
        if (!rc) continue;
        const missingCount = shortages[key] || 0;
        const requiredCount = rc.units;
        const availableCount = Math.max(0, requiredCount - missingCount);
        formattedShortages.push({
          componentType: toLegacyComponentType(rc.componentType),
          bloodGroup: rc.aboGroup,
          rh: rc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
          required: requiredCount,
          available: availableCount,
          compatibleGroupsSearched: [rc.aboGroup],
        });
      }

      const isMultiComponent = req.requestedComponents.length > 1;
      const hasAnyMatch = matched.length > 0;
      return { requisition: updated, shortages: formattedShortages, partial: isMultiComponent && hasAnyMatch };
    },

    async approve(id, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status !== 'MATCHED' && req.status !== 'CROSSMATCHED') {
        throw new ConflictError(
          `Cannot approve requisition in status ${req.status}. Must be MATCHED or CROSSMATCHED.`,
        );
      }
      const updated = await deps.requisitions.setStatus(id, 'APPROVED', actorId);
      await audit.record({
        actorId,
        action: 'RELEASE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        after: { status: 'APPROVED' },
      });
      log.info({ requisitionId: req.requisitionId, actorId }, 'requisition approved');
      return updated;
    },

    async complete(id, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status !== 'ISSUED' && req.status !== 'APPROVED') {
        throw new ConflictError(`Cannot complete requisition in status ${req.status}.`);
      }


      const updated = await deps.requisitions.setStatus(id, 'COMPLETED', actorId);
      await audit.record({
        actorId,
        action: 'UPDATE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        after: { status: 'COMPLETED' },
      });
      log.info({ requisitionId: req.requisitionId, actorId }, 'requisition completed');
      return updated;
    },

    async get(id) {
      return deps.requisitions.findById(id);
    },

    async reject(id, reason, actorId) {
      const req = await deps.requisitions.findById(id);
      for (const m of req.matchedUnits) {
        await deps.units
          .applyEvent({
            unitId: m.unitId,
            event: 'UNRESERVE',
            actorId,
            reason: `Requisition ${req.requisitionId} rejected`,
            set: {
              reservedFor: null,
              reservedAt: null,
              reservedUntil: null,
              issuedAt: null,
              issuedTo: null,
            } as any,
          })
          .catch(() => undefined);
      }
      const updated = await deps.requisitions.reject(id, reason, actorId);
      await audit.record({
        actorId,
        action: 'DELETE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        after: { status: 'REJECTED', reason },
      });
      return updated;
    },
    async setStatus(id, status, actorId) {
      return deps.requisitions.setStatus(id, status, actorId);
    },

    async issueAll(id, unitIds, actorId) {
      const requisition = await deps.requisitions.findById(id);
      const results: Array<{ issueId: string; unitId: string }> = [];

      const targetUnits =
        Array.isArray(unitIds) && unitIds.length > 0
          ? requisition.matchedUnits.filter((u) => unitIds.includes(u.unitId))
          : requisition.matchedUnits;

      for (const unit of targetUnits) {
        const result = await deps.issue.issue({ requisitionId: id, unitId: unit.unitId }, actorId);
        results.push(result);
      }

      const matchedUnitIds = requisition.matchedUnits.map((mu) => mu.unitId);
      const allIssued = await deps.units.allIssued(matchedUnitIds);
      await deps.requisitions.setStatus(id, allIssued ? 'COMPLETED' : 'APPROVED', actorId);

      return results;
    },

    async updateCrossmatchLegacy(id, input, actorId) {
      const { inventoryId, crossmatchStatus, compatibilityResult, crossmatchDoneAt, crossmatchSeenAt, cardNumber } = input;

      const request = await deps.requisitions.findById(id);
      if (!['MATCHED', 'APPROVED'].includes(request.status)) {
        throw new ConflictError('Crossmatch can only be updated for matched or approved requests');
      }

      const miEntry = request.matchedUnits.find((mu) => mu.unitId === inventoryId);
      if (!miEntry) {
        throw new NotFoundError("Inventory item in this request's matched inventory", inventoryId);
      }
      if (!miEntry.crossmatchRequired) {
        throw new ValidationError('Crossmatch is not required for this component type');
      }

      const crossmatchDetails = { compatibilityResult, crossmatchDoneAt, crossmatchSeenAt, cardNumber };

      if (crossmatchStatus === 'compatible') {
        await deps.crossmatch.perform(
          { requisitionId: request.id, unitId: inventoryId, method: 'IS', result: 'COMPATIBLE', ...crossmatchDetails },
          actorId,
        );
        return deps.requisitions.findById(id);
      }

      // Incompatible: crossmatch.perform already released the unit and
      // flagged it INCOMPATIBLE on the requisition; additionally drop it
      // from matchedUnits and try to auto-reserve a same-priority
      // replacement so the request doesn't stall.
      await deps.crossmatch.perform(
        { requisitionId: request.id, unitId: inventoryId, method: 'IS', result: 'INCOMPATIBLE', ...crossmatchDetails },
        actorId,
      );

      let updatedReq = await deps.requisitions.removeMatchedUnit(id, inventoryId);

      const patient = await deps.patients.findById(request.patientId);
      const patientAbo = patient.aboGroup || 'O';
      const patientRh = patient.rhFactor || 'POSITIVE';

      const releasedUnit = await deps.units.findByUnitId(inventoryId);
      if (releasedUnit) {
        const compType = releasedUnit.componentType;
        const compatibleGroups = compatibleAboGroups(patientAbo, compType);
        const rhOnlyNegative =
          (['PRBC', 'WHOLE_BLOOD', 'LEUKOREDUCED_PRBC', 'WASHED_PRBC', 'IRRADIATED_PRBC'] as string[]).includes(
            compType,
          ) && patientRh === 'NEGATIVE';

        const alreadyMatchedIds = updatedReq.matchedUnits.map((mu) => mu.unitId);
        const replacement = await deps.units.findBestReplacement({
          componentType: compType,
          excludeUnitIds: alreadyMatchedIds,
          compatibleAboGroups: [...compatibleGroups],
          rhFilter: rhOnlyNegative ? 'NEGATIVE' : undefined,
          patientAbo,
          patientRh,
        });

        if (replacement) {
          const isExact = replacement.aboGroup === patientAbo && replacement.rhFactor === patientRh;
          const needsXm = requiresCrossmatch(compType);
          const reserved = await deps.units
            .applyEvent({
              unitId: replacement.unitId,
              event: 'RESERVE',
              actorId,
              reason: `Auto-replacement for incompatible crossmatch on unit ${inventoryId}`,
              set: { reservedFor: id, reservedAt: new Date() },
            })
            .catch(() => null);

          if (reserved) {
            updatedReq = await deps.requisitions.pushMatchedUnit(id, {
              unitId: replacement.unitId,
              componentType: compType,
              compatibilityType: isExact ? 'EXACT' : 'COMPATIBLE',
              crossmatchRequired: needsXm,
              crossmatchStatus: needsXm ? 'PENDING' : 'NOT_REQUIRED',
              reservedAt: new Date(),
            });
          }
        }
      }

      return updatedReq;
    },
  };
}

function dateStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}
function rand(): string {
  return new Types.ObjectId().toHexString().slice(-6).toUpperCase();
}
