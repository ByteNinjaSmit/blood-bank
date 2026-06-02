// BloodUnit repository. Every status write goes through `applyEvent`,
// which calls the domain state machine — no caller can put a unit into
// an illegal state. Reads support the FEFO selector.

import { Types } from 'mongoose';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { transition, type UnitEvent } from '@/modules/unit/unit.state-machine';
import { NotFoundError } from '@/shared/errors';
import { invalidate } from '@/core/cache';
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
  ): Promise<number>;
  selectable(filter: {
    componentType: ComponentType;
    aboGroups: AboGroup[];
  }): Promise<SelectableUnit[]>;
  inStockSummary(): Promise<Array<{ componentType: string; aboGroup: string; rhFactor: string; count: number }>>;
  /** Non-terminal units already past expiry — candidates for auto-EXPIRE. */
  findExpiredUnitIds(now?: Date): Promise<string[]>;
  /** RELEASED units expiring within `days` — for the near-expiry alert. */
  findNearExpiry(
    days: number,
    now?: Date,
  ): Promise<Array<{ unitId: string; componentType: string; aboGroup: string; rhFactor: string; expiresAt: string }>>;
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
            k === 'reservedFor' || k === 'issuedTo' || k === 'transfusedTo'
              ? new Types.ObjectId(v as string)
              : v;
        }
      }

      const updated = (await BloodUnitModel.findOneAndUpdate({ unitId }, update, {
        new: true,
      }).lean()) as RawUnit | null;
      if (!updated) throw new NotFoundError('BloodUnit', unitId);
      void invalidate('inventory:*'); // stock view changed
      return toDto(updated);
    },

    async applyEventToDonation(donationId, event, actorId, fromStatuses) {
      const units = (await BloodUnitModel.find({
        donationId,
        status: { $in: fromStatuses },
        deletedAt: null,
      })) as Array<RawUnit & { status: UnitStatus }>;
      const actor = new Types.ObjectId(actorId);
      let changed = 0;
      for (const u of units) {
        const next = transition(u.status, event, u.unitId);
        await BloodUnitModel.updateOne(
          { _id: u._id },
          {
            status: next,
            updatedBy: actor,
            $push: {
              statusHistory: { from: u.status, to: next, event, actor, at: new Date() },
            },
          },
        );
        changed++;
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

    async findExpiredUnitIds(now = new Date()) {
      const raws = (await BloodUnitModel.find({
        status: { $in: ['COLLECTED', 'IN_TESTING', 'QUARANTINE', 'RELEASED', 'RESERVED', 'CROSSMATCHED'] },
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
