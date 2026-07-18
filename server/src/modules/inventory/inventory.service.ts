import { Types } from 'mongoose';
import { childLogger } from '@/core/logger';
import { cached } from '@/core/cache';
import { selectUnits, type SelectionResult } from '@/shared/compatibility/fefo';
import { classify, compatibleAboGroups } from '@/shared/compatibility/abo-rh';
import { ConflictError, InvalidUnitTransition } from '@/shared/errors';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { PatientRepo } from '@/modules/patient/patient.repository';
import type {
  RequisitionRepo,
  MatchedUnitDto,
  RequisitionPatientDto,
} from '@/modules/requisition/requisition.repository';
import type { DonationRepo } from '@/modules/donation/donation.repository';
import type { AboGroup, ComponentType, RhFactor, SpecialNeed } from '@/shared/enums';

const STOCK_SUMMARY_CACHE_KEY = 'inventory:summary';
const STOCK_SUMMARY_TTL_SECONDS = 30;
const NEAR_EXPIRY_TTL_SECONDS = 60;

export interface SelectRequest {
  component: ComponentType;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  specialNeeds: SpecialNeed[];
  unitsRequired: number;
}

export interface NearExpiryUnit {
  unitId: string;
  componentType: string;
  aboGroup: string;
  rhFactor: string;
  expiresAt: string;
  daysLeft: number;
}

export interface ReservePatientInput {
  name: string;
  age: number;
  sex: 'M' | 'F' | 'O';
  mrn?: string;
  diagnosis?: string;
  indication?: string;
  hb?: number;
  specialNeeds?: SpecialNeed[];
  history?: RequisitionPatientDto['history'];
  pregnancy?: RequisitionPatientDto['pregnancy'];
}

export interface ReserveItemInput {
  componentType: string;
  units: number;
  bloodGroup: AboGroup;
  rh: string;
}

export interface ReserveRequest {
  hospitalId: string;
  reservedUntil?: Date;
  doctorName?: string;
  medicalOfficerSignature?: string;
  hospitalSeal?: string;
  patient: ReservePatientInput;
  items: ReserveItemInput[];
}

export interface ReserveResultItem {
  _id: string;
  bagNo: string;
  bag: { bagNo: string; bloodGroup: string; rh: string };
  component: { componentType: string; expiryDate: string };
}

export interface ReserveResult {
  matchedCount: number;
  items: ReserveResultItem[];
}

export interface InventoryService {
  selectFefo(req: SelectRequest): Promise<SelectionResult>;
  reserve(req: ReserveRequest, actorId: string): Promise<ReserveResult>;
  stockSummary(): Promise<
    Array<{ componentType: string; aboGroup: string; rhFactor: string; count: number }>
  >;
  nearExpiry(days: number): Promise<NearExpiryUnit[]>;
}

function dateStamp(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

function normalizeRh(rh: string): RhFactor {
  const upper = rh.toUpperCase();
  return upper === 'POSITIVE' || upper === 'NEGATIVE' ? (upper as RhFactor) : (rh as RhFactor);
}

export function createInventoryService(deps: {
  units: UnitRepo;
  patients: PatientRepo;
  requisitions: RequisitionRepo;
  donations: DonationRepo;
}): InventoryService {
  const log = childLogger({ module: 'inventory-service' });

  /** FEFO-select candidate units for one requested component line. */
  async function selectForComponent(rc: {
    componentType: ComponentType;
    aboGroup: AboGroup;
    rhFactor: RhFactor;
    specialNeeds: SpecialNeed[];
    units: number;
  }): Promise<SelectionResult> {
    const aboGroups = [...compatibleAboGroups(rc.aboGroup, rc.componentType)];
    const candidates = await deps.units.selectable({ componentType: rc.componentType, aboGroups });
    return selectUnits(candidates, {
      recipient: { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
      component: rc.componentType,
      specialNeeds: rc.specialNeeds,
      unitsRequired: rc.units,
    });
  }

  return {
    async selectFefo(req) {
      const aboGroups = [...compatibleAboGroups(req.aboGroup, req.component)];
      const candidates = await deps.units.selectable({ componentType: req.component, aboGroups });
      const result = selectUnits(candidates, {
        recipient: { aboGroup: req.aboGroup, rhFactor: req.rhFactor },
        component: req.component,
        specialNeeds: req.specialNeeds,
        unitsRequired: req.unitsRequired,
      });
      if (result.shortage > 0) {
        log.warn(
          { ...req, shortage: result.shortage, found: result.selected.length },
          'inventory shortage',
        );
      }
      return result;
    },

    async reserve(req, actorId) {
      // Normalize the requested component lines once.
      const requestedComponents = req.items.map((it) => ({
        componentType: it.componentType as ComponentType,
        units: it.units,
        aboGroup: it.bloodGroup,
        rhFactor: normalizeRh(it.rh),
        urgency: 'ROUTINE' as const,
        specialNeeds: (req.patient.specialNeeds ?? []) as SpecialNeed[],
      }));

      // 1. Check stock availability up-front, before creating any records,
      //    so a shortage aborts cleanly with no patient/requisition to roll back.
      const shortages: Array<{ componentType: string; required: number; available: number }> = [];
      for (const rc of requestedComponents) {
        const selection = await selectForComponent(rc);
        if (selection.shortage > 0) {
          shortages.push({
            componentType: rc.componentType,
            required: rc.units,
            available: selection.selected.length,
          });
        }
      }
      if (shortages.length > 0) {
        throw new ConflictError('Insufficient stock to reserve all items', { shortages });
      }

      // 2. Cap the reservation window at 3 days from now.
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const reservedUntil =
        req.reservedUntil && !isNaN(req.reservedUntil.getTime())
          ? req.reservedUntil > threeDaysFromNow
            ? threeDaysFromNow
            : req.reservedUntil
          : threeDaysFromNow;

      // 3. Create the patient record.
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - req.patient.age);
      const patient = await deps.patients.create(
        {
          patientPublicId: `PA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          name: req.patient.name,
          dob,
          sex: req.patient.sex,
          medicalRecordNumber: req.patient.mrn,
          specialNeeds: req.patient.specialNeeds ?? [],
        },
        actorId,
      );

      // 4. Create the requisition.
      const requisition = await deps.requisitions.create(
        {
          requisitionId: `RQ-${dateStamp()}-${new Types.ObjectId().toHexString().slice(-6).toUpperCase()}`,
          hospitalId: req.hospitalId,
          patientId: patient.id,
          clinicianName: req.doctorName || 'Reserve Wizard',
          doctorName: req.doctorName,
          requiredAt: reservedUntil,
          patient: {
            name: req.patient.name,
            age: req.patient.age,
            sex: req.patient.sex,
            mrn: req.patient.mrn,
            diagnosis: req.patient.diagnosis,
            indication: req.patient.indication,
            hb: req.patient.hb,
            specialNeeds: req.patient.specialNeeds ?? [],
            history: req.patient.history,
            pregnancy: req.patient.pregnancy,
          },
          requestedComponents: requestedComponents.map((rc) => ({
            componentType: rc.componentType,
            units: rc.units,
            aboGroup: rc.aboGroup,
            rhFactor: rc.rhFactor,
            urgency: rc.urgency,
          })),
        },
        actorId,
      );

      // 5. Reserve the FEFO-selected units through the state machine.
      const matched: MatchedUnitDto[] = [];
      for (const rc of requestedComponents) {
        const selection = await selectForComponent(rc);
        for (const sel of selection.selected) {
          let unit;
          try {
            unit = await deps.units.applyEvent({
              unitId: sel.unit.unitId,
              event: 'RESERVE',
              actorId,
              reason: `Reserved for requisition ${requisition.requisitionId} via Reserve Wizard`,
              set: {
                reservedFor: requisition.id,
                reservedAt: new Date(),
                reservedUntil,
              },
            });
          } catch (err) {
            // A concurrent reservation grabbed this unit between selection and
            // reserve; skip it rather than corrupting state.
            if (err instanceof InvalidUnitTransition) continue;
            throw err;
          }
          matched.push({
            unitId: unit.unitId,
            componentType: rc.componentType,
            compatibilityType: classify(
              { aboGroup: rc.aboGroup, rhFactor: rc.rhFactor },
              { aboGroup: unit.aboGroup, rhFactor: unit.rhFactor },
            ),
            crossmatchRequired: false,
            crossmatchStatus: 'NOT_REQUIRED',
          });
        }
      }

      // 6. Attach the matched units to the requisition (status -> MATCHED).
      await deps.requisitions.setMatched(requisition.id, matched, actorId);

      // 7. Build the response, resolving bag numbers for the matched units.
      const matchedUnitIds = matched.map((m) => m.unitId);
      const units = await Promise.all(matchedUnitIds.map((id) => deps.units.findByUnitId(id)));
      const donationIds = units
        .map((u) => u?.donationId)
        .filter((d): d is string => Boolean(d));
      const bagNoMap = await deps.donations.bagNosByDonationIds(donationIds);

      const items: ReserveResultItem[] = units
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .map((u) => {
          const bagNo = bagNoMap[u.donationId] || u.donationId;
          return {
            _id: u.id,
            bagNo,
            bag: {
              bagNo,
              bloodGroup: u.aboGroup,
              rh: u.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
            },
            component: {
              componentType: u.componentType,
              expiryDate: u.expiresAt,
            },
          };
        });

      return { matchedCount: items.length, items };
    },

    async stockSummary() {
      return cached(STOCK_SUMMARY_CACHE_KEY, STOCK_SUMMARY_TTL_SECONDS, () =>
        deps.units.inStockSummary(),
      );
    },

    async nearExpiry(days) {
      const key = `inventory:near-expiry:days=${days}`;
      return cached(key, NEAR_EXPIRY_TTL_SECONDS, async () => {
        const raw = await deps.units.findNearExpiry(days);
        const now = Date.now();
        return raw.map((u) => ({
          unitId: u.unitId,
          componentType: u.componentType,
          aboGroup: u.aboGroup,
          rhFactor: u.rhFactor,
          expiresAt: u.expiresAt,
          daysLeft: Math.max(0, Math.ceil((new Date(u.expiresAt).getTime() - now) / 86_400_000)),
        }));
      });
    },
  };
}
