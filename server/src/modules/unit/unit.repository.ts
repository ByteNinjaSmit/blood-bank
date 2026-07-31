// BloodUnit repository. Every status write goes through `applyEvent`,
// which calls the domain state machine — no caller can put a unit into
// an illegal state. Reads support the FEFO selector.

import { Types } from 'mongoose';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { transition, type UnitEvent } from '@/modules/unit/unit.state-machine';
import { NotFoundError } from '@/shared/errors';
import { invalidate } from '@/core/cache';
import { withAudit } from '@/shared/utils/with-audit';
import type {
  AboGroup,
  ComponentType,
  DiscardReason,
  RhFactor,
  SpecialNeed,
  UnitStatus,
} from '@/shared/enums';
import type { SelectableUnit } from '@/shared/compatibility/fefo';

export interface UnitDto {
  id: string;
  unitId: string;
  unitDin: string | null;
  donationId: string;
  componentType: ComponentType;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  volumeMl: number;
  collectedAt: string;
  expiresAt: string;
  status: UnitStatus;
  specialAttributes: SpecialNeed[];
  storageLocation: string | null;
  clinicalIndicationPatient: {
    firstName: string;
    middleName: string;
    lastName: string;
    address: string;
    age: number;
    sex: string;
    bloodGroup: string;
    disease?: string;
    otherDiseaseName?: string;
  } | null;
}

interface RawUnit {
  _id: { toString(): string };
  unitId: string;
  unitDin: string | null;
  donationId: string;
  componentType: ComponentType;
  aboGroup: AboGroup;
  rhFactor: RhFactor;
  volumeMl: number;
  collectedAt: Date;
  expiresAt: Date;
  status: UnitStatus;
  specialAttributes?: SpecialNeed[];
  storageLocation?: string | null;
  clinicalIndicationPatient?: {
    firstName: string;
    middleName: string;
    lastName: string;
    address: string;
    age: number;
    sex: string;
    bloodGroup: string;
    disease?: string;
    otherDiseaseName?: string;
  } | null;
}

function toDto(raw: RawUnit): UnitDto {
  return {
    id: raw._id.toString(),
    unitId: raw.unitId,
    unitDin: raw.unitDin ?? null,
    donationId: raw.donationId,
    componentType: raw.componentType,
    aboGroup: raw.aboGroup,
    rhFactor: raw.rhFactor,
    volumeMl: raw.volumeMl,
    collectedAt: raw.collectedAt.toISOString(),
    expiresAt: raw.expiresAt.toISOString(),
    status: raw.status,
    specialAttributes: raw.specialAttributes ?? [],
    storageLocation: raw.storageLocation ?? null,
    clinicalIndicationPatient: raw.clinicalIndicationPatient ?? null,
  };
}

export interface ApplyEventInput {
  unitId: string; // the business unitId, not _id
  event: UnitEvent;
  actorId: string;
  reason?: string;
  set?: Partial<{
    quarantineReason: string;
    discardReason: DiscardReason;
    reservedFor: string;
    reservedAt: Date;
    reservedUntil: Date;
    issuedTo: string;
    issuedAt: Date;
    transfusedTo: string;
    transfusedAt: Date;
    specialAttributes: SpecialNeed[];
  }>;
}

export interface UnitRepo {
  findByUnitId(unitId: string): Promise<UnitDto | null>;
  findReleasableByDonation(donationId: string): Promise<UnitDto[]>;
  applyEvent(input: ApplyEventInput): Promise<UnitDto>;
  applyEventToDonation(
    donationId: string,
    event: UnitEvent,
    actorId: string,
    fromStatuses: UnitStatus[],
    reason?: string,
    /**
     * `match` narrows which units of the donation qualify beyond status
     * (e.g. `{ discardReason: 'TTI_POSITIVE' }` so a TTI correction only
     * reinstates units it itself discarded). `set` applies extra field
     * writes alongside the status transition (e.g. clearing/tagging
     * `discardReason`).
     */
    extra?: { match?: Record<string, unknown>; set?: Record<string, unknown>; requestId?: string },
  ): Promise<number>;
  selectable(filter: {
    componentType: ComponentType;
    aboGroups: AboGroup[];
  }): Promise<SelectableUnit[]>;
  /**
   * Available RELEASED units for operator selection in Match Review,
   * enriched with the donation bag/segment number for display. Returns
   * one row per in-stock, non-expired unit of the given component and
   * ABO groups, FEFO-sorted.
   */
  availableForSelection(filter: {
    componentType: ComponentType;
    aboGroups: AboGroup[];
  }): Promise<
    Array<{
      unitId: string;
      aboGroup: AboGroup;
      rhFactor: RhFactor;
      componentType: ComponentType;
      volumeMl: number;
      expiresAt: string;
      bagNo: string;
      segmentNo: string;
    }>
  >;
  inStockSummary(): Promise<
    Array<{ componentType: string; aboGroup: string; rhFactor: string; count: number }>
  >;
  /** Non-terminal units already past expiry — candidates for auto-EXPIRE. */
  findExpiredUnitIds(now?: Date): Promise<string[]>;
  /** RELEASED units expiring within `days` — for the near-expiry alert. */
  findNearExpiry(
    days: number,
    now?: Date,
  ): Promise<
    Array<{
      unitId: string;
      componentType: string;
      aboGroup: string;
      rhFactor: string;
      expiresAt: string;
    }>
  >;
  /**
   * Best available RELEASED replacement for a unit that just failed
   * crossmatch: same component type, a compatible ABO group, matching
   * Rh constraint, not already matched to this requisition, prioritizing
   * an exact ABO/Rh match over merely-compatible, then FEFO.
   */
  findBestReplacement(input: {
    componentType: ComponentType;
    excludeUnitIds: string[];
    compatibleAboGroups: AboGroup[];
    rhFilter?: RhFactor;
    patientAbo: AboGroup;
    patientRh: RhFactor;
  }): Promise<{ unitId: string; aboGroup: AboGroup; rhFactor: RhFactor } | null>;
  /** True if every given unitId currently has status ISSUED. */
  allIssued(unitIds: string[]): Promise<boolean>;
  /**
   * Donation ids (out of the given set) that have at least one unit which
   * has ever left the bank (status history shows an ISSUE event, or the
   * unit is currently ISSUED/TRANSFUSED/RETURNED_UNUSED) — used to lock
   * TTI results and component edits once a component is out the door.
   */
  findDonationsWithIssuedUnit(donationIds: string[]): Promise<Set<string>>;
}

export function createUnitRepo(): UnitRepo {
  return {
    async findByUnitId(unitId) {
      const raw = (await BloodUnitModel.findOne({ unitId }).lean()) as RawUnit | null;
      return raw ? toDto(raw) : null;
    },

    async findReleasableByDonation(donationId) {
      const raws = (await BloodUnitModel.find({
        donationId,
        status: { $in: ['QUARANTINE', 'IN_TESTING', 'COLLECTED'] },
        deletedAt: null,
      }).lean()) as RawUnit[];
      return raws.map(toDto);
    },

    async applyEvent({ unitId, event, actorId, reason, set }) {
      const current = (await BloodUnitModel.findOne({ unitId })) as
        | (RawUnit & { save: () => Promise<unknown>; status: UnitStatus })
        | null;
      if (!current) throw new NotFoundError('BloodUnit', unitId);

      const nextStatus = transition(current.status, event, unitId);
      const actor = new Types.ObjectId(actorId);

      const update: Record<string, unknown> = {
        status: nextStatus,
        updatedBy: actor,
        $push: {
          statusHistory: {
            from: current.status,
            to: nextStatus,
            event,
            actor,
            at: new Date(),
            reason,
          },
        },
      };
      if (set) {
        for (const [k, v] of Object.entries(set)) {
          if (v === undefined) continue;
          update[k] =
            (k === 'reservedFor' || k === 'issuedTo' || k === 'transfusedTo') && v
              ? new Types.ObjectId(v as string)
              : v;
        }
      }

      const updated = (await BloodUnitModel.findOneAndUpdate({ unitId }, update, {
        new: true,
      }).lean()) as RawUnit | null;
      if (!updated) throw new NotFoundError('BloodUnit', unitId);
      void invalidate('inventory:*'); // stock view changed

      void withAudit(
        { actorId },
        {
          module: 'unit',
          action: 'STATE_TRANSITION',
          entityType: 'BloodUnit',
          entityId: unitId,
          entityLabel: unitId,
          reason,
        },
        { status: current.status },
        { status: nextStatus, event },
      );

      return toDto(updated);
    },

    async applyEventToDonation(donationId, event, actorId, fromStatuses, reason, extra) {
      const actor = new Types.ObjectId(actorId);
      let changed = 0;
      const findFilter = {
        donationId,
        status: { $in: fromStatuses },
        deletedAt: null,
        ...(extra?.match ?? {}),
      };
      // Collected outside the transaction and fired once it commits, so a
      // transaction retry never double-writes audit entries.
      const auditEntries: Array<{ unitId: string; from: UnitStatus; to: UnitStatus }> = [];

      try {
        const session = await BloodUnitModel.startSession();
        try {
          await session.withTransaction(async () => {
            const units = (await BloodUnitModel.find(
              findFilter,
              null,
              { session },
            )) as Array<RawUnit & { status: UnitStatus }>;

            for (const u of units) {
              const next = transition(u.status, event, u.unitId);
              await BloodUnitModel.updateOne(
                { _id: u._id, status: u.status }, // optimistic check: status must still match
                {
                  status: next,
                  updatedBy: actor,
                  ...(extra?.set ?? {}),
                  $push: {
                    statusHistory: { from: u.status, to: next, event, actor, at: new Date(), reason },
                  },
                },
                { session },
              );
              changed++;
              auditEntries.push({ unitId: u.unitId, from: u.status, to: next });
            }
          });
        } finally {
          await session.endSession();
        }
      } catch (err: any) {
        const units = (await BloodUnitModel.find(findFilter)) as Array<RawUnit & { status: UnitStatus }>;

        for (const u of units) {
          const next = transition(u.status, event, u.unitId);
          await BloodUnitModel.updateOne(
            { _id: u._id, status: u.status },
            {
              status: next,
              updatedBy: actor,
              ...(extra?.set ?? {}),
              $push: {
                statusHistory: { from: u.status, to: next, event, actor, at: new Date(), reason },
              },
            },
          );
          changed++;
          auditEntries.push({ unitId: u.unitId, from: u.status, to: next });
        }
      }

      for (const entry of auditEntries) {
        void withAudit(
          { actorId, requestId: extra?.requestId },
          {
            module: 'unit',
            action: 'STATE_TRANSITION',
            entityType: 'BloodUnit',
            entityId: entry.unitId,
            entityLabel: entry.unitId,
            reason,
          },
          { status: entry.from },
          { status: entry.to, event },
        );
      }

      if (changed > 0) void invalidate('inventory:*');
      return changed;
    },

    async selectable({ componentType, aboGroups }) {
      const raws = (await BloodUnitModel.find({
        componentType,
        aboGroup: { $in: aboGroups },
        status: 'RELEASED',
        deletedAt: null,
        expiresAt: { $gt: new Date() },
      })
        .sort({ expiresAt: 1 })
        .lean()) as RawUnit[];
      return raws.map((r) => ({
        unitId: r.unitId,
        componentType: r.componentType,
        aboGroup: r.aboGroup,
        rhFactor: r.rhFactor,
        expiresAt: r.expiresAt,
        specialAttributes: new Set(r.specialAttributes ?? []),
        status: r.status,
      }));
    },

    async availableForSelection({ componentType, aboGroups }) {
      const raws = (await BloodUnitModel.find({
        componentType,
        aboGroup: { $in: aboGroups },
        status: 'RELEASED',
        deletedAt: null,
        expiresAt: { $gt: new Date() },
      })
        .sort({ expiresAt: 1 })
        .select('unitId aboGroup rhFactor componentType volumeMl expiresAt donationId unitDin')
        .lean()) as RawUnit[];

      const donationIds = raws.map((r) => r.donationId).filter(Boolean);
      const donations = (await DonationModel.find({ donationId: { $in: donationIds } })
        .select('donationId bagNo segmentNo')
        .lean()) as Array<{ donationId: string; bagNo?: string; segmentNo?: string }>;
      const donationMap = new Map(donations.map((d) => [d.donationId, d]));

      return raws.map((r) => {
        const d = donationMap.get(r.donationId);
        return {
          unitId: r.unitId,
          aboGroup: r.aboGroup,
          rhFactor: r.rhFactor,
          componentType: r.componentType,
          volumeMl: r.volumeMl,
          expiresAt: r.expiresAt.toISOString(),
          bagNo: d?.bagNo || r.donationId,
          segmentNo: d?.segmentNo || r.unitDin || r.unitId,
        };
      });
    },

    async findExpiredUnitIds(now = new Date()) {
      const raws = (await BloodUnitModel.find({
        status: {
          $in: ['COLLECTED', 'IN_TESTING', 'QUARANTINE', 'RELEASED', 'RESERVED', 'CROSSMATCHED'],
        },
        deletedAt: null,
        expiresAt: { $lte: now },
      })
        .select('unitId')
        .lean()) as Array<{ unitId: string }>;
      return raws.map((r) => r.unitId);
    },

    async findNearExpiry(days, now = new Date()) {
      const cutoff = new Date(now.getTime() + days * 86_400_000);
      const raws = (await BloodUnitModel.find({
        status: 'RELEASED',
        deletedAt: null,
        expiresAt: { $gt: now, $lte: cutoff },
      })
        .sort({ expiresAt: 1 })
        .select('unitId componentType aboGroup rhFactor expiresAt')
        .lean()) as RawUnit[];
      return raws.map((r) => ({
        unitId: r.unitId,
        componentType: r.componentType,
        aboGroup: r.aboGroup,
        rhFactor: r.rhFactor,
        expiresAt: r.expiresAt.toISOString(),
      }));
    },

    async findBestReplacement({ componentType, excludeUnitIds, compatibleAboGroups, rhFilter, patientAbo, patientRh }) {
      const now = new Date();
      const matches = await BloodUnitModel.aggregate([
        {
          $match: {
            status: 'RELEASED',
            unitId: { $nin: excludeUnitIds },
            componentType,
            aboGroup: { $in: compatibleAboGroups },
            ...(rhFilter ? { rhFactor: rhFilter } : { rhFactor: { $in: ['POSITIVE', 'NEGATIVE'] } }),
            expiresAt: { $gte: now },
            $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
          },
        },
        {
          $addFields: {
            _matchPriority: {
              $cond: [{ $and: [{ $eq: ['$aboGroup', patientAbo] }, { $eq: ['$rhFactor', patientRh] }] }, 0, 1],
            },
          },
        },
        { $sort: { _matchPriority: 1, expiresAt: 1, createdAt: 1 } },
        { $limit: 1 },
      ]);
      if (matches.length === 0) return null;
      const rep = matches[0];
      return { unitId: rep.unitId, aboGroup: rep.aboGroup, rhFactor: rep.rhFactor };
    },

    async allIssued(unitIds) {
      const units = await BloodUnitModel.find({ unitId: { $in: unitIds } }).select('status').lean();
      return units.every((u) => u.status === 'ISSUED');
    },

    async findDonationsWithIssuedUnit(donationIds) {
      if (donationIds.length === 0) return new Set();
      const units = await BloodUnitModel.find({
        donationId: { $in: donationIds },
        $or: [
          { status: { $in: ['ISSUED', 'TRANSFUSED', 'RETURNED_UNUSED'] } },
          { 'statusHistory.to': 'ISSUED' },
        ],
      })
        .select('donationId')
        .lean();
      return new Set(units.map((u) => u.donationId));
    },

    async inStockSummary() {
      return BloodUnitModel.aggregate([
        { $match: { status: 'RELEASED', deletedAt: null, expiresAt: { $gt: new Date() } } },
        {
          $group: {
            _id: { componentType: '$componentType', aboGroup: '$aboGroup', rhFactor: '$rhFactor' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            componentType: '$_id.componentType',
            aboGroup: '$_id.aboGroup',
            rhFactor: '$_id.rhFactor',
            count: 1,
          },
        },
        { $sort: { componentType: 1, aboGroup: 1, rhFactor: 1 } },
      ]);
    },
  };
}
