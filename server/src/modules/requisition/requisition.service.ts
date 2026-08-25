import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import type { IAuditService } from '@/shared/interfaces';
import { auditService as defaultAudit } from '@/modules/audit/audit.service';
import { selectUnits } from '@/shared/compatibility/fefo';
import {
  classify,
  requiresCrossmatch,
  compatibleAboGroups,
  isRhAcceptable,
} from '@/shared/compatibility/abo-rh';
import type { AboGroup, ComponentType } from '@/shared/enums';
import type { GroupingWorksheetDto } from '@/modules/requisition/requisition.repository';
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
import type { IssueRepo } from '@/modules/issue/issue.repository';
import { normalizeRequestedComponents } from '@/modules/requisition/requisition.mapper';
import { approvalBlockers } from '@/modules/requisition/requisition.approval-readiness';
import { notificationCenterService } from '@/modules/notification/notification-center.service';

export interface MatchShortageDto {
  componentType: string;
  bloodGroup: string;
  rh: string;
  required: number;
  available: number;
  compatibleGroupsSearched: string[];
  /**
   * Patient special-need flags applied as a hard filter during selection.
   * When non-empty, a shortage may be due to no in-stock unit carrying these
   * attributes rather than an ABO/Rh stock-out — surfaced so the UI can say so.
   */
  specialNeeds: string[];
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
  // 'pending' resets a recorded (but unreserved) crossmatch so the operator
  // can edit it — the worksheet reopens prefilled with the stored details.
  crossmatchStatus: 'compatible' | 'incompatible' | 'pending';
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
    input: Omit<CreateRequisitionInput, 'requisitionId' | 'clinicianName'> & { clinicianName?: string },
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
    issuedAt?: Date,
  ): Promise<Array<{ issueId: string; unitId: string }>>;
  /** Legacy per-unit crossmatch update with auto-replacement on incompatible result. */
  updateCrossmatchLegacy(
    id: string,
    input: UpdateCrossmatchLegacyInput,
    actorId: string,
  ): Promise<RequisitionDto>;
  /**
   * Available in-stock bags an operator may pick for a component in Match
   * Review: the ABO groups compatible with the requested component plus
   * the units available per group.
   */
  availableUnits(
    id: string,
    componentType: ComponentType,
    aboGroup?: AboGroup,
  ): Promise<{
    compatibleGroups: AboGroup[];
    units: Array<{
      unitId: string;
      aboGroup: AboGroup;
      rhFactor: string;
      componentType: ComponentType;
      volumeMl: number;
      expiresAt: string;
      bagNo: string;
      segmentNo: string;
    }>;
  }>;
  /** Swaps one proposed matched unit for another available compatible bag (no reservation). */
  swapMatchedUnit(
    id: string,
    fromUnitId: string,
    toUnitId: string,
    actorId: string,
  ): Promise<RequisitionDto>;
  /** Saves the recipient (patient-side) grouping worksheet. */
  setRecipientGrouping(
    id: string,
    grouping: GroupingWorksheetDto,
    actorId: string,
  ): Promise<RequisitionDto>;
  /** Saves a per-bag (donor-side) grouping worksheet. */
  setMatchedUnitGrouping(
    id: string,
    unitId: string,
    grouping: GroupingWorksheetDto,
    actorId: string,
  ): Promise<RequisitionDto>;
  /** Toggles the substitute-group compatibility sign-off on a bag. */
  confirmCompatibility(
    id: string,
    unitId: string,
    confirmed: boolean,
    actorId: string,
  ): Promise<RequisitionDto>;
  /** Rejects one component (drops its bags) while the requisition continues. */
  rejectComponent(
    id: string,
    componentType: string,
    reason: string,
    actorId: string,
  ): Promise<RequisitionDto>;
  /** Rejects one matched bag (drops it, keeps a record) while the requisition continues. */
  rejectBag(id: string, unitId: string, reason: string, actorId: string): Promise<RequisitionDto>;
  /** Manually unreserves one matched (not-yet-issued) unit, returning it to stock. */
  unreserve(id: string, unitId: string, reason: string, actorId: string): Promise<RequisitionDto>;
  /** Reverts one or more mistakenly-issued units back to stock (ISSUED -> RELEASED). */
  unissueUnits(
    id: string,
    unitIds: string[],
    reason: string,
    actorId: string,
  ): Promise<RequisitionDto>;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Returns the UTC instant corresponding to 19:00 IST (Asia/Kolkata, fixed
// +05:30, no DST) on (now + addDays), regardless of the server process's
// own OS/container timezone.
function istCutoffAt19(addDays: number): Date {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);
  istNow.setUTCDate(istNow.getUTCDate() + addDays);
  istNow.setUTCHours(19, 0, 0, 0);
  return new Date(istNow.getTime() - IST_OFFSET_MS);
}

// Reservation window: the requisition's required-by date when it's a valid
// future time earlier than the day-3 cutoff, otherwise the day-3 cutoff
// itself — end of day at 19:00 IST (the fixed auto-unreserve moment).
export function computeReservedUntil(requiredAt?: Date | null): Date {
  const day3Cutoff = istCutoffAt19(3);
  if (
    requiredAt &&
    !isNaN(requiredAt.getTime()) &&
    requiredAt.getTime() > Date.now() &&
    requiredAt.getTime() < day3Cutoff.getTime()
  ) {
    return requiredAt;
  }
  return day3Cutoff;
}

export function createRequisitionService(deps: {
  requisitions: RequisitionRepo;
  units: UnitRepo;
  patients: PatientRepo;
  crossmatch: CrossmatchService;
  issue: IssueService;
  issues?: IssueRepo;
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
      const patient = await deps.patients.findById(input.patientId);
      const requisitionId = `RQ-${dateStamp()}-${rand()}`;
      const clinicianName = input.clinicianName || input.doctorName || 'Not Specified';
      const doctorName = input.doctorName || clinicianName;
      const created = await deps.requisitions.create(
        { ...input, clinicianName, doctorName, requisitionId },
        actorId,
      );
      await audit.record({
        actorId,
        module: 'requisition',
        action: 'CREATE',
        entityType: 'Requisition',
        entityId: created.requisitionId,
        after: { patientName: patient.name, status: 'PENDING' },
      });
      log.info({ requisitionId, patientId: input.patientId, actorId }, 'requisition created');
      return created;
    },

    async update(id, input, actorId) {
      const existing = await deps.requisitions.findById(id);
      const { editReason, ...patch } = input as typeof input & { editReason?: string };

      if (input.patient) {
        let dob: Date | undefined;
        if (input.patient.age) {
          dob = new Date();
          if (input.patient.ageUnit === 'DAYS') {
            dob.setDate(dob.getDate() - input.patient.age);
          } else {
            dob.setFullYear(dob.getFullYear() - input.patient.age);
          }
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
        { ...patch, clinicianName, doctorName },
        actorId,
      );
      if (!updated) throw new NotFoundError('Requisition', id);
      await audit.record({
        actorId,
        module: 'requisition',
        action: 'UPDATE',
        entityType: 'Requisition',
        entityId: existing.requisitionId,
        before: existing,
        after: updated,
        reason: editReason,
      });
      return updated;
    },

    async match(id, actorId) {
      const req = await deps.requisitions.findById(id);
      // Re-matching is also how "Edit" adds bags for a quantity increase
      // after approval/issue — allowed on any status except REJECTED. The
      // incremental logic below never touches already-ISSUED units, so
      // this is safe post-approval: it only fills the shortfall.
      if (req.status === 'REJECTED') {
        throw new ConflictError(`Cannot match requisition in status ${req.status}`);
      }

      const patient = await deps.patients.findById(req.patientId);

      // Reservation now happens right here at match time (not on approve),
      // so bags show as reserved the moment a requisition is created. A
      // re-match (e.g. from Edit, after the requested quantity changed)
      // must be non-destructive: units already ISSUED are locked and never
      // touched; units still RESERVED/CROSSMATCHED for an unchanged
      // component are left alone; only the delta (shortfall to reserve
      // more, or excess to release) is adjusted per component.
      const existingByComponent = new Map<
        string,
        Array<MatchedUnitDto & { locked: boolean }>
      >();
      for (const m of req.matchedUnits ?? []) {
        const unit = await deps.units.findByUnitId(m.unitId).catch(() => null);
        const locked = !unit || !['RELEASED', 'RESERVED', 'CROSSMATCHED'].includes(unit.status);
        const list = existingByComponent.get(m.componentType) ?? [];
        list.push({ ...m, locked });
        existingByComponent.set(m.componentType, list);
      }

      const matched: MatchedUnitDto[] = [];
      const shortages: Record<string, number> = {};
      // Per-component availability outcome, applied as component status after
      // setMatched. Rejected components are skipped entirely (no bags proposed).
      const componentOutcome: Array<{ componentType: string; available: number }> = [];
      const reservedUntil = computeReservedUntil(
        req.requiredAt ? new Date(req.requiredAt) : null,
      );

      for (const rc of req.requestedComponents) {
        const kept = existingByComponent.get(rc.componentType) ?? [];
        if (rc.status === 'REJECTED') {
          // A rejected component keeps nothing matched; any previously kept
          // (non-locked) units are released back to stock.
          for (const k of kept) {
            if (k.locked) continue;
            await deps.units
              .applyEvent({
                unitId: k.unitId,
                event: 'UNRESERVE',
                actorId,
                reason: `Component ${rc.componentType} rejected on requisition ${req.requisitionId}`,
                set: { reservedFor: null, reservedAt: null, reservedUntil: null } as any,
              })
              .catch(() => undefined);
          }
          continue;
        }

        const lockedUnits = kept.filter((k) => k.locked);
        const nonLocked = kept.filter((k) => !k.locked);
        matched.push(...lockedUnits.map(({ locked, ...rest }) => rest));
        matched.push(...nonLocked.map(({ locked, ...rest }) => rest));

        const need = rc.units - kept.length;
        if (need <= 0) {
          if (need < 0) {
            // Excess beyond the new target: release the most-recently
            // matched non-locked units first.
            const toDrop = nonLocked.slice(need); // need is negative
            for (const d of toDrop) {
              await deps.units
                .applyEvent({
                  unitId: d.unitId,
                  event: 'UNRESERVE',
                  actorId,
                  reason: `Requested units reduced for ${rc.componentType} on requisition ${req.requisitionId}`,
                  set: { reservedFor: null, reservedAt: null, reservedUntil: null } as any,
                })
                .catch(() => undefined);
              const idx = matched.findIndex((mm) => mm.unitId === d.unitId);
              if (idx >= 0) matched.splice(idx, 1);
            }
          }
          componentOutcome.push({ componentType: rc.componentType, available: kept.length + need });
          continue;
        }

        // need > 0: reserve additional units for the shortfall.
        const aboGroups = [...compatibleAboGroups(rc.aboGroup, rc.componentType)];
        const alreadyPicked = new Set(kept.map((k) => k.unitId));
        const candidates = (
          await deps.units.selectable({ componentType: rc.componentType, aboGroups })
        ).filter((c) => !alreadyPicked.has(c.unitId));
        const selection = selectUnits(candidates, {
          recipient: { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
          component: rc.componentType,
          specialNeeds: patient.specialNeeds,
          unitsRequired: need,
        });

        const needsXm = requiresCrossmatch(rc.componentType);
        let reservedCount = 0;
        for (const sel of selection.selected) {
          try {
            await deps.units.applyEvent({
              unitId: sel.unit.unitId,
              event: 'RESERVE',
              actorId,
              reason: `Reserved on match of requisition ${req.requisitionId}`,
              set: { reservedFor: req.id, reservedAt: new Date(), reservedUntil },
            });
          } catch {
            continue; // bag grabbed elsewhere between selection and reserve
          }
          matched.push({
            unitId: sel.unit.unitId,
            componentType: rc.componentType,
            compatibilityType: classify(
              { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
              { aboGroup: sel.unit.aboGroup, rhFactor: sel.unit.rhFactor },
            ),
            reserved: true,
            compatibilityConfirmed: false,
            crossmatchRequired: needsXm,
            crossmatchStatus: needsXm ? 'PENDING' : 'NOT_REQUIRED',
          });
          reservedCount++;
        }

        // reservedCount already falls short of `need` for both reasons
        // (not enough candidates, or a candidate's RESERVE call failing) —
        // selection.shortage must not be added again on top of that.
        const shortfall = need - reservedCount;
        if (shortfall > 0) {
          shortages[`${rc.componentType}-${rc.aboGroup}${rc.rhFactor}`] = shortfall;
        }
        componentOutcome.push({
          componentType: rc.componentType,
          available: kept.length + reservedCount,
        });
      }

      // A re-match past the initial PENDING->MATCHED transition (e.g. Edit
      // adding bags to an already-approved/issued requisition) must not
      // regress the status — only the very first match sets MATCHED.
      const nextStatus = req.status === 'PENDING' ? 'MATCHED' : req.status;
      const updated = await deps.requisitions.setMatched(id, matched, actorId, nextStatus);
      // Flag components with no compatible/available stock as UNAVAILABLE so
      // the status persists throughout the requisition; the rest are ACTIVE.
      // (Return value not reused — the client refreshes the requisition after
      // match, which reflects these statuses.)
      for (const co of componentOutcome) {
        await deps.requisitions.setComponentStatus(
          id,
          co.componentType,
          co.available === 0 ? 'UNAVAILABLE' : 'ACTIVE',
          null,
          actorId,
        );
      }
      log.info(
        { requisitionId: req.requisitionId, matched: matched.length, shortages },
        'requisition matched',
      );

      const shortageKeys = Object.keys(shortages);
      await audit.record({
        actorId,
        module: 'requisition',
        action: 'UPDATE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        before: { status: req.status },
        after: {
          status: updated.status,
          matchedCount: matched.length,
          shortageCount: shortageKeys.length,
        },
      });
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
          componentType: rc.componentType,
          bloodGroup: rc.aboGroup,
          rh: rc.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
          required: requiredCount,
          available: availableCount,
          compatibleGroupsSearched: [rc.aboGroup],
          specialNeeds: patient.specialNeeds ?? [],
        });
      }

      // A multi-component request always proceeds with whatever matched (even
      // nothing) — the operator handles unavailable components downstream.
      // Only a single-component request with a full stock-out hard-fails.
      const isMultiComponent = req.requestedComponents.length > 1;
      return { requisition: updated, shortages: formattedShortages, partial: isMultiComponent };
    },

    async approve(id, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status !== 'MATCHED' && req.status !== 'CROSSMATCHED') {
        throw new ConflictError(
          `Cannot approve requisition in status ${req.status}. Must be MATCHED or CROSSMATCHED.`,
        );
      }

      // Non-bypassable safety gate: a compatible crossmatch (and, for
      // substitute-group bags, a compatibility sign-off) must be recorded
      // before reservation.
      const blockers = approvalBlockers(req.matchedUnits);
      if (blockers.length > 0) {
        throw new ValidationError(
          'Cannot approve: complete the crossmatch worksheet first.',
          { blockers },
        );
      }

      // Reservation already happened at match time (units are RESERVED as
      // soon as they're proposed) — approve() no longer reserves anything,
      // it just commits the crossmatch worksheet and flips the status.

      // Commit any crossmatch that was recorded (as data) during Match
      // Review: now that the unit is reserved, run the RESERVED -> CROSSMATCHED
      // transition so PRBC units clear the issue gate. Pending/incompatible
      // units are left as-is (they cannot be issued until resolved).
      for (const m of req.matchedUnits) {
        if (m.crossmatchRequired && m.crossmatchStatus === 'COMPATIBLE') {
          await deps.crossmatch
            .perform(
              {
                requisitionId: req.id,
                unitId: m.unitId,
                method: 'IS',
                result: 'COMPATIBLE',
                compatibilityResult: m.compatibilityResult ?? undefined,
                crossmatchDoneAt: m.crossmatchDoneAt ? new Date(m.crossmatchDoneAt) : undefined,
                crossmatchSeenAt: m.crossmatchSeenAt ? new Date(m.crossmatchSeenAt) : undefined,
                cardNumber: m.cardNumber ?? undefined,
              },
              actorId,
            )
            .catch((e) =>
              log.warn(
                { unitId: m.unitId, err: (e as Error).message },
                'failed to commit crossmatch on approval',
              ),
            );
        }
      }

      const updated = await deps.requisitions.setStatus(id, 'APPROVED', actorId);
      await audit.record({
        actorId,
        module: 'requisition',
        action: 'RELEASE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        before: { status: req.status },
        after: { status: 'APPROVED' },
      });
      log.info({ requisitionId: req.requisitionId, actorId }, 'requisition approved');
      return updated;
    },

    async complete(id, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status === 'COMPLETED') {
        return req;
      }
      if (req.status !== 'ISSUED' && req.status !== 'APPROVED') {
        throw new ConflictError(`Cannot complete requisition in status ${req.status}.`);
      }

      const updated = await deps.requisitions.setStatus(id, 'COMPLETED', actorId);
      await audit.record({
        actorId,
        module: 'requisition',
        action: 'UPDATE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        before: { status: req.status },
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
      const rejectReason = `Requisition ${req.requisitionId} rejected`;
      for (const m of req.matchedUnits) {
        try {
          await deps.units.applyEvent({
            unitId: m.unitId,
            event: 'UNRESERVE',
            actorId,
            reason: rejectReason,
            set: {
              reservedFor: null,
              reservedAt: null,
              reservedUntil: null,
              issuedAt: null,
              issuedTo: null,
              unreservedBy: 'MANUAL',
              unreservedReason: rejectReason,
            } as any,
          });
        } catch {
          // Already ISSUED (or otherwise not RESERVED/CROSSMATCHED) — no
          // UNRESERVE transition exists from there; leave it as-is and
          // don't touch its matched-unit entry below either.
          continue;
        }
        // Keep the matched-unit entry's own reserved/crossmatch fields in
        // sync with the unit — same as the manual unreserve path — so the
        // View shows "Unreserved — Manually unreserved" instead of a stale
        // "Reserved" badge, and a stale compatible crossmatch can't carry
        // over if this same bag gets picked up by a future requisition.
        await deps.requisitions
          .markUnreserved(id, m.unitId, 'MANUAL', rejectReason, actorId, m.crossmatchRequired)
          .catch(() => undefined);
      }
      const updated = await deps.requisitions.reject(id, reason, actorId);
      await audit.record({
        actorId,
        module: 'requisition',
        action: 'DELETE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        before: { status: req.status },
        after: { status: 'REJECTED', reason },
        reason,
      });
      return updated;
    },
    async setStatus(id, status, actorId) {
      return deps.requisitions.setStatus(id, status, actorId);
    },

    async issueAll(id, unitIds, actorId, issuedAt) {
      const requisition = await deps.requisitions.findById(id);
      const results: Array<{ issueId: string; unitId: string }> = [];

      const targetUnits =
        Array.isArray(unitIds) && unitIds.length > 0
          ? requisition.matchedUnits.filter((u) => unitIds.includes(u.unitId))
          : requisition.matchedUnits;

      for (const unit of targetUnits) {
        const result = await deps.issue.issue(
          { requisitionId: id, unitId: unit.unitId, issuedAt },
          actorId,
        );
        results.push(result);
      }

      const matchedUnitIds = requisition.matchedUnits.map((mu) => mu.unitId);
      const allIssued = await deps.units.allIssued(matchedUnitIds);
      await deps.requisitions.setStatus(id, allIssued ? 'COMPLETED' : 'APPROVED', actorId);

      await audit.record({
        actorId,
        module: 'requisition',
        action: allIssued ? 'ISSUE' : 'UPDATE',
        entityType: 'Requisition',
        entityId: requisition.requisitionId,
        before: { status: requisition.status },
        after: {
          status: allIssued ? 'COMPLETED' : 'APPROVED',
          totalRequested: requisition.matchedUnits.length,
          componentsIssued: results.length,
          componentsRemaining: targetUnits.length - results.length,
          issuedAt: new Date(),
        },
      });

      return results;
    },

    async updateCrossmatchLegacy(id, input, actorId) {
      const {
        inventoryId,
        crossmatchStatus,
        compatibilityResult,
        crossmatchDoneAt,
        crossmatchSeenAt,
        cardNumber,
      } = input;

      const request = await deps.requisitions.findById(id);
      if (request.status === 'REJECTED') {
        throw new ConflictError('Crossmatch cannot be updated on a rejected requisition');
      }

      const miEntry = request.matchedUnits.find((mu) => mu.unitId === inventoryId);
      if (!miEntry) {
        throw new NotFoundError("Inventory item in this request's matched inventory", inventoryId);
      }
      if (!miEntry.crossmatchRequired) {
        throw new ValidationError('Crossmatch is not required for this component type');
      }

      const crossmatchDetails = {
        compatibilityResult,
        crossmatchDoneAt,
        crossmatchSeenAt,
        cardNumber,
      };

      // Reservation now happens at match time, so a matched unit is
      // RESERVED (not just "proposed") from the moment it's picked —
      // there's no longer a pre-reservation phase to defer the real
      // CROSSMATCH transition to. The worksheet commits immediately here,
      // regardless of the overall requisition status (PENDING through
      // ISSUED/COMPLETED all have this be valid — e.g. Edit adding extra
      // bags to an already-approved/issued requisition still needs its own
      // crossmatch before *those* bags can be issued). Only a bag whose
      // crossmatch has already been committed (unit status CROSSMATCHED)
      // blocks a 'pending' reset.
      const unit = await deps.units.findByUnitId(inventoryId).catch(() => null);
      if (crossmatchStatus === 'pending') {
        if (unit?.status === 'CROSSMATCHED') {
          throw new ConflictError('Crossmatch cannot be edited after it has been committed.');
        }
        return deps.requisitions.setCrossmatchStatus(id, inventoryId, 'PENDING', actorId, undefined);
      }

      if (crossmatchStatus === 'compatible') {
        await deps.crossmatch.perform(
          {
            requisitionId: request.id,
            unitId: inventoryId,
            method: 'IS',
            result: 'COMPATIBLE',
            ...crossmatchDetails,
          },
          actorId,
        );
        return deps.requisitions.findById(id);
      }

      // Incompatible: crossmatch.perform already released the unit and
      // flagged it INCOMPATIBLE on the requisition; additionally drop it
      // from matchedUnits and try to auto-reserve a same-priority
      // replacement so the request doesn't stall.
      await deps.crossmatch.perform(
        {
          requisitionId: request.id,
          unitId: inventoryId,
          method: 'IS',
          result: 'INCOMPATIBLE',
          ...crossmatchDetails,
        },
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
          (['PRBC', 'WB'] as string[]).includes(compType) && patientRh === 'NEGATIVE';

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

    async availableUnits(id, componentType, aboGroup) {
      const req = await deps.requisitions.findById(id);
      const rc = req.requestedComponents.find((c) => c.componentType === componentType);
      if (!rc) {
        throw new ValidationError(`Requisition has no requested ${componentType} component`);
      }
      const compatibleGroups = [...compatibleAboGroups(rc.aboGroup, componentType)];
      const searchGroups = aboGroup ? [aboGroup] : compatibleGroups;

      const rows = await deps.units.availableForSelection({
        componentType,
        aboGroups: searchGroups as AboGroup[],
      });
      // Respect the Rh constraint (Rh-negative recipient needs Rh-negative
      // RBC/WB); other components accept either.
      const units = rows.filter((u) =>
        isRhAcceptable(rc.rhFactor, u.rhFactor as any, componentType),
      );
      return { compatibleGroups, units };
    },

    async swapMatchedUnit(id, fromUnitId, toUnitId, actorId) {
      const req = await deps.requisitions.findById(id);
      if (req.status === 'REJECTED') {
        throw new ConflictError(`Bags cannot be changed on a rejected requisition.`);
      }
      const current = req.matchedUnits.find((mu) => mu.unitId === fromUnitId);
      if (!current) {
        throw new NotFoundError('Matched unit in this requisition', fromUnitId);
      }
      // Reservation now happens at match time, so every matched unit is
      // normally already RESERVED — that alone must not block a swap
      // anymore. Only an already-issued (or later) bag is truly locked.
      const currentUnit = await deps.units.findByUnitId(fromUnitId).catch(() => null);
      if (currentUnit && !['RELEASED', 'RESERVED', 'CROSSMATCHED'].includes(currentUnit.status)) {
        throw new ConflictError(
          `Bag ${fromUnitId} is already ${currentUnit.status.toLowerCase()} and cannot be swapped.`,
        );
      }
      if (req.matchedUnits.some((mu) => mu.unitId === toUnitId)) {
        throw new ConflictError('That bag is already selected for this requisition.');
      }

      const compType = current.componentType;
      const rc = req.requestedComponents.find((c) => c.componentType === compType);
      if (!rc) throw new ValidationError(`Requisition has no requested ${compType} component`);

      const target = await deps.units.findByUnitId(toUnitId);
      if (!target) throw new NotFoundError('BloodUnit', toUnitId);
      if (target.status !== 'RELEASED') {
        throw new ConflictError(`Bag ${toUnitId} is not available (status ${target.status}).`);
      }
      if (target.componentType !== compType) {
        throw new ValidationError(
          `Bag ${toUnitId} is a ${target.componentType}, not a ${compType}.`,
        );
      }
      const allowedGroups = compatibleAboGroups(rc.aboGroup, compType);
      if (!allowedGroups.includes(target.aboGroup)) {
        throw new ValidationError(
          `Bag ${toUnitId} (${target.aboGroup}) is not ABO-compatible for a ${rc.aboGroup} recipient.`,
        );
      }
      if (!isRhAcceptable(rc.rhFactor, target.rhFactor, compType)) {
        throw new ValidationError(`Bag ${toUnitId} Rh is not compatible for this recipient.`);
      }

      const needsXm = requiresCrossmatch(compType);
      const reservedUntil = computeReservedUntil(
        req.requiredAt ? new Date(req.requiredAt) : null,
      );

      // Release the outgoing bag back to stock (if it was actually held),
      // then reserve the incoming one — reservation must follow the bag,
      // not stay pinned to whichever unit was picked first.
      if (currentUnit && ['RESERVED', 'CROSSMATCHED'].includes(currentUnit.status)) {
        await deps.units
          .applyEvent({
            unitId: fromUnitId,
            event: 'UNRESERVE',
            actorId,
            reason: `Swapped out on requisition ${req.requisitionId}`,
            set: { reservedFor: null, reservedAt: null, reservedUntil: null } as any,
          })
          .catch(() => undefined);
      }
      await deps.units.applyEvent({
        unitId: target.unitId,
        event: 'RESERVE',
        actorId,
        reason: `Swapped in on requisition ${req.requisitionId}`,
        set: { reservedFor: req.id, reservedAt: new Date(), reservedUntil },
      });

      const swapped = await deps.requisitions.swapMatchedUnit(id, fromUnitId, {
        unitId: target.unitId,
        componentType: compType,
        compatibilityType: classify(
          { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
          { aboGroup: target.aboGroup, rhFactor: target.rhFactor },
        ),
        reserved: true,
        // A new bag resets any prior crossmatch/compatibility sign-off.
        compatibilityConfirmed: false,
        crossmatchRequired: needsXm,
        crossmatchStatus: needsXm ? 'PENDING' : 'NOT_REQUIRED',
      });

      await audit.record({
        actorId,
        module: 'requisition',
        action: 'UPDATE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        before: { matchedUnit: fromUnitId },
        after: { matchedUnit: toUnitId },
      });
      return swapped;
    },

    async setRecipientGrouping(id, grouping, actorId) {
      await deps.requisitions.findById(id);
      return deps.requisitions.setRecipientGrouping(id, grouping, actorId);
    },

    async setMatchedUnitGrouping(id, unitId, grouping, actorId) {
      return deps.requisitions.setMatchedUnitGrouping(id, unitId, grouping, actorId);
    },

    async confirmCompatibility(id, unitId, confirmed, actorId) {
      const req = await deps.requisitions.findById(id);
      const mu = req.matchedUnits.find((m) => m.unitId === unitId);
      if (!mu) throw new NotFoundError('Matched unit in this requisition', unitId);
      // Reservation now happens at match time, so `mu.reserved` is normally
      // always true by the time this runs — that alone must not block the
      // sign-off anymore. Only once the bag has actually gone out (issued
      // or beyond) is this locked.
      const unit = await deps.units.findByUnitId(unitId).catch(() => null);
      if (unit && !['RELEASED', 'RESERVED', 'CROSSMATCHED'].includes(unit.status)) {
        throw new ConflictError('Compatibility sign-off cannot change after the unit is issued.');
      }
      return deps.requisitions.setMatchedUnitCompatibilityConfirmed(id, unitId, confirmed, actorId);
    },

    async rejectComponent(id, componentType, reason, actorId) {
      const req = await deps.requisitions.findById(id);
      const rc = req.requestedComponents.find((c) => c.componentType === componentType);
      if (!rc) throw new NotFoundError('Requisition component', componentType);
      if (!['PENDING', 'MATCHED'].includes(req.status)) {
        throw new ConflictError(
          `Components can only be rejected before approval (status is ${req.status}).`,
        );
      }

      // Release any reserved bags of this component (proposed ones need no
      // unit write), then drop them from the requisition and flag the
      // component REJECTED — the rest of the requisition continues.
      for (const m of req.matchedUnits.filter((mu) => mu.componentType === componentType)) {
        if (!m.reserved) continue;
        await deps.units
          .applyEvent({
            unitId: m.unitId,
            event: 'UNRESERVE',
            actorId,
            reason: `Component ${componentType} rejected on requisition ${req.requisitionId}`,
            set: { reservedFor: null, reservedAt: null, reservedUntil: null } as any,
          })
          .catch(() => undefined);
      }
      await deps.requisitions.removeMatchedUnitsByComponent(id, componentType);
      const updated = await deps.requisitions.setComponentStatus(
        id,
        componentType,
        'REJECTED',
        reason,
        actorId,
      );

      await audit.record({
        actorId,
        module: 'requisition',
        action: 'UPDATE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        before: { component: componentType, status: rc.status || 'ACTIVE' },
        after: { component: componentType, status: 'REJECTED', reason },
        reason,
      });
      return updated;
    },

    async rejectBag(id, unitId, reason, actorId) {
      const req = await deps.requisitions.findById(id);
      const mu = req.matchedUnits.find((m) => m.unitId === unitId);
      if (!mu) throw new NotFoundError('Matched unit in this requisition', unitId);
      if (!['PENDING', 'MATCHED'].includes(req.status)) {
        throw new ConflictError(
          `Bags can only be rejected before approval (status is ${req.status}).`,
        );
      }

      // Release the bag if it was somehow already reserved, then drop it from
      // matchedUnits and keep a permanent rejected-bag record — the rest of
      // the component/requisition continues.
      if (mu.reserved) {
        await deps.units
          .applyEvent({
            unitId,
            event: 'UNRESERVE',
            actorId,
            reason: `Bag rejected on requisition ${req.requisitionId}`,
            set: { reservedFor: null, reservedAt: null, reservedUntil: null } as any,
          })
          .catch(() => undefined);
      }

      const unit = await deps.units.findByUnitId(unitId).catch(() => null);
      await deps.requisitions.removeMatchedUnit(id, unitId);
      const updated = await deps.requisitions.pushRejectedUnit(
        id,
        {
          unitId,
          componentType: mu.componentType,
          bloodGroup: unit?.aboGroup,
          rh: unit?.rhFactor,
          reason,
        },
        actorId,
      );

      await audit.record({
        actorId,
        module: 'requisition',
        action: 'UPDATE',
        entityType: 'Requisition',
        entityId: req.requisitionId,
        before: { unitId, status: 'MATCHED' },
        after: { unitId, status: 'REJECTED', reason },
        reason,
      });
      return updated;
    },

    async unreserve(id, unitId, reason, actorId) {
      const req = await deps.requisitions.findById(id);
      const mu = req.matchedUnits.find((m) => m.unitId === unitId);
      if (!mu) throw new NotFoundError('Matched unit in this requisition', unitId);

      const unit = await deps.units.findByUnitId(unitId);
      if (!unit || !['RESERVED', 'CROSSMATCHED'].includes(unit.status)) {
        throw new ConflictError(`Bag ${unitId} is not currently reserved.`);
      }

      await deps.units.applyEvent({
        unitId,
        event: 'UNRESERVE',
        actorId,
        reason,
        set: {
          reservedFor: null,
          reservedAt: null,
          reservedUntil: null,
          unreservedBy: 'MANUAL',
          unreservedReason: reason,
        } as any,
      });
      const updated = await deps.requisitions.markUnreserved(
        id,
        unitId,
        'MANUAL',
        reason,
        actorId,
        mu.crossmatchRequired,
      );

      await audit.record({
        actorId,
        module: 'requisition',
        action: 'UPDATE',
        entityType: 'BloodUnit',
        entityId: unitId,
        entityLabel: `Bag ${unitId}`,
        before: { status: unit.status, reservedFor: req.requisitionId },
        after: { status: 'RELEASED', unreservedBy: 'MANUAL', reason },
        reason,
      });
      void notificationCenterService
        .notify({
          title: 'Reservation manually cancelled',
          message: `Unit ${unitId} (${mu.componentType}) manually unreserved for requisition ${req.requisitionId}: ${reason}`,
          module: 'INVENTORY',
          category: 'RESERVATION_EXPIRED',
          severity: 'INFORMATION',
          relatedRecordId: unitId,
          relatedRecordType: 'BloodUnit',
          actionLink: `/requisition/${id}`,
        })
        .catch(() => undefined);

      log.info({ requisitionId: req.requisitionId, unitId, actorId }, 'unit manually unreserved');
      return updated;
    },

    async unissueUnits(id, unitIds, reason, actorId) {
      const req = await deps.requisitions.findById(id);
      const targets = req.matchedUnits.filter((m) => unitIds.includes(m.unitId));
      if (targets.length === 0) {
        throw new NotFoundError('Matched unit(s) in this requisition', unitIds.join(', '));
      }

      let updated = req;
      const reservedUntil = computeReservedUntil(
        req.requiredAt ? new Date(req.requiredAt) : null,
      );
      for (const mu of targets) {
        const unit = await deps.units.findByUnitId(mu.unitId).catch(() => null);
        if (!unit || unit.status !== 'ISSUED') {
          throw new ConflictError(`Bag ${mu.unitId} is not currently issued.`);
        }
        // One step back, not all the way to stock: UNISSUE lands the unit
        // back on RESERVED, still held against this same requisition, so it
        // stays listed here and can be issued again from the same screen.
        await deps.units.applyEvent({
          unitId: mu.unitId,
          event: 'UNISSUE',
          actorId,
          reason,
          set: {
            issuedAt: null,
            issuedTo: null,
            reservedFor: req.id,
            reservedAt: new Date(),
            reservedUntil,
            unreservedBy: null,
            unreservedReason: null,
          } as any,
        });
        updated = await deps.requisitions.markReserved(id, mu.unitId, actorId);
        // Void the Issue record too (soft-delete) — otherwise its issueId
        // keeps showing on this bag as if it were still actively issued,
        // even after it's been unissued (and possibly unreserved next).
        await deps.issues?.voidForUnit(id, mu.unitId, actorId).catch(() => undefined);

        await audit.record({
          actorId,
          module: 'requisition',
          action: 'UPDATE',
          entityType: 'BloodUnit',
          entityId: mu.unitId,
          before: { status: 'ISSUED' },
          after: { status: 'RESERVED', reason },
          reason,
        });
        void notificationCenterService
          .notify({
            title: 'Issue reverted (unissued)',
            message: `Unit ${mu.unitId} (${mu.componentType}) unissued and returned to Reserved on requisition ${req.requisitionId}: ${reason}`,
            module: 'ISSUE_BLOOD',
            category: 'BLOOD_ISSUED',
            severity: 'WARNING',
            relatedRecordId: mu.unitId,
            relatedRecordType: 'BloodUnit',
            actionLink: `/requisition/${id}`,
          })
          .catch(() => undefined);
      }

      // If the requisition had been marked COMPLETED, an un-issue means it
      // no longer is — revert to APPROVED so it re-enters the active
      // workflow and the Issue action stays available for this bag.
      if (updated.status === 'COMPLETED') {
        updated = await deps.requisitions.setStatus(id, 'APPROVED', actorId);
      }

      log.info(
        { requisitionId: req.requisitionId, unitIds, actorId },
        'unit(s) unissued back to reserved',
      );
      return updated;
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
