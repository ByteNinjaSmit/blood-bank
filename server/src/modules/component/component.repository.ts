// Read/write data access for the component-separation views. No model
// of its own — like `mis`, it reads/writes models owned by donation/
// unit/tti/bag-inspection/donor. Status writes for existing units go
// through `unit.repository`'s event-based `applyEventToDonation` (state
// machine enforced); initial unit creation in `separate()` has no prior
// status to transition from, so it sets the initial COLLECTED status
// directly, same as donation registration does elsewhere.
import mongoose, { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import { DonorModel } from '@/modules/donor/donor.model';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import { NotFoundError, ConflictError, ValidationError } from '@/shared/errors';
import {
  toLegacyUnitStatus,
  mapSerologyTests,
  hasLeftBank,
} from '@/modules/component/component.mapper';
import { getShelfDays, PRODUCT_CODE } from '@/shared/component-type';
import type { ComponentType } from '@/shared/enums';

export interface ComponentListFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  expiryBefore?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  order?: 'asc' | 'desc';
}

export interface NearExpiryFilters {
  page?: number;
  limit?: number;
  days?: number;
  componentType?: string;
  status?: string;
  search?: string;
}

async function resolveDonation(donationIdOrObjectId: string) {
  let donation = await DonationModel.findOne({
    donationId: donationIdOrObjectId,
    deletedAt: null,
  }).lean();
  if (!donation && Types.ObjectId.isValid(donationIdOrObjectId)) {
    donation = await DonationModel.findOne({
      _id: donationIdOrObjectId,
      deletedAt: null,
    }).lean();
  }
  return donation;
}

function componentSlot(units: any[], types: string[], tti: any) {
  const u = units.find((x) => types.includes(x.componentType));
  if (!u) return { status: 'unprepared' as const };

  return {
    status: 'prepared' as const,
    componentStatus: toLegacyUnitStatus(u.status, tti?.releaseDecision),
    volumeMl: u.volumeMl,
    expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
    storageLocation: u.storageLocation || 'Main Fridge',
  };
}

export interface ComponentRepo {
  list(filters: ComponentListFilters): Promise<{ components: any[]; total: number; totalPages: number }>;
  listBagsToSeparate(): Promise<any[]>;
  separate(input: {
    donationId: string;
    componentType: string;
    volumeMl?: number;
    rpmFirstSpin?: string;
    rpmSecondSpin?: string;
    separationTime?: Date;
    actorId: string;
  }): Promise<any>;
  separationCompleted(input: {
    donationId: string;
    signature: string;
    actorId: string;
  }): Promise<{ donationId: string }>;
  nearExpiry(
    filters: NearExpiryFilters,
  ): Promise<{ components: any[]; total: number; totalPages: number }>;
  getGroupDetail(id: string): Promise<any>;
  /** Pre-mutation snapshot for a single component unit — used by the
   * service layer to populate the audit `before` payload ahead of patch(). */
  getUnitSnapshot(id: string): Promise<any>;
  /** Pre-mutation snapshot of every component unit in a bag — used by
   * the service layer to populate the audit `before` payload ahead of patchBag(). */
  getBagSnapshot(donationId: string): Promise<any[]>;
  patch(
    id: string,
    fields: { volumeMl?: number; storageLocation?: string; expiryDate?: string },
    actorId: string,
  ): Promise<any>;
  /**
   * Bag-level correction: component type/volume per already-separated
   * unit, plus the shared spin log/separation time, in one call — used
   * by the Component List edit screen. Blocked once any unit from this
   * donation has left the bank, and always requires a reason.
   */
  patchBag(
    donationId: string,
    fields: {
      components: Array<{
        unitId: string;
        componentType: string;
        volumeMl: number;
        storageLocation?: string;
        expiryDate?: Date;
      }>;
      rpmFirstSpin?: string;
      rpmSecondSpin?: string;
      separationTime?: Date;
      editReason: string;
    },
    actorId: string,
  ): Promise<void>;
}

export function createComponentRepo(deps: { units: UnitRepo }): ComponentRepo {
  return {
    async list(filters) {
      const { page, limit, type, status, expiryBefore, fromDate, toDate, search, order } = filters;

      const unitFilter: any = { deletedAt: null, status: { $ne: 'COLLECTED' } };
      if (type) unitFilter.componentType = type;
      if (status) {
        if (status === 'in-stock') unitFilter.status = 'RELEASED';
        else if (status === 'reserved') unitFilter.status = 'RESERVED';
        else if (status === 'issued') unitFilter.status = 'ISSUED';
        else if (status === 'discarded') unitFilter.status = 'DISCARDED';
      }
      if (expiryBefore) unitFilter.expiresAt = { $lte: new Date(expiryBefore) };
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        unitFilter.$or = [
          { donationId: searchRegex },
          { unitId: searchRegex },
          { aboGroup: searchRegex },
        ];
      }

      const hasUnitFilters = Boolean(type || status || expiryBefore || search);
      const matchingDonationIds = hasUnitFilters
        ? await BloodUnitModel.distinct('donationId', unitFilter)
        : [];

      const donationFilter: any = { deletedAt: null };
      if (hasUnitFilters) donationFilter.donationId = { $in: matchingDonationIds };
      if (fromDate || toDate) {
        donationFilter.collectedAt = {};
        if (fromDate) donationFilter.collectedAt.$gte = new Date(fromDate);
        if (toDate) donationFilter.collectedAt.$lte = new Date(toDate);
      }
      if (search && !matchingDonationIds.length && !hasUnitFilters) {
        donationFilter.donationId = new RegExp(search, 'i');
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;
      const skipNum = (pageNum - 1) * limitNum;
      const sortDir = order === 'asc' ? 1 : -1;

      const total = await DonationModel.countDocuments(donationFilter);
      const donations = await DonationModel.find(donationFilter)
        .sort({ collectedAt: sortDir })
        .skip(skipNum)
        .limit(limitNum)
        .populate('campId', 'name')
        .lean();

      const donationIds = donations.map((d) => d.donationId);
      const allUnits = await BloodUnitModel.find({
        donationId: { $in: donationIds },
        deletedAt: null,
        status: { $ne: 'COLLECTED' },
      }).lean();
      const ttiResults = await TtiResultModel.find({ donationId: { $in: donationIds } }).lean();

      const unitsMap: Record<string, typeof allUnits> = {};
      allUnits.forEach((u) => {
        if (!u.donationId) return;
        (unitsMap[u.donationId] ??= []).push(u);
      });
      const ttiMap = new Map(ttiResults.map((t) => [t.donationId, t]));

      const components = donations.map((d) => {
        const units = unitsMap[d.donationId] || [];
        const tti = ttiMap.get(d.donationId);

        const abo = tti?.aboGroupConfirmed || units[0]?.aboGroup || 'O';
        const rh = tti?.rhFactorConfirmed || units[0]?.rhFactor || 'POSITIVE';

        const separation = (d as any).separation;

        return {
          id: d._id.toString(),
          bagNo: (d as any).bagNo || d.donationId,
          segmentNo: (d as any).segmentNo || '',
          bloodGroup: `${abo}${rh === 'POSITIVE' ? '+' : '-'}`,
          site: d.campId ? (d.campId as any).name : 'Inhouse',
          createdAt: (d.createdAt ?? d.collectedAt).toISOString(),
          rpmFirstSpin: separation?.rpmFirstSpin || '',
          rpmSecondSpin: separation?.rpmSecondSpin || '',
          collectionTime: d.collectedAt.toISOString(),
          separationTime: separation?.separationTime ? separation.separationTime.toISOString() : '',
          serologyTests: mapSerologyTests(tti),
          canEdit: !hasLeftBank(units),
          editReason: (d as any).lastEditReason || undefined,
          lastEditedAt: (d as any).lastEditedAt ? new Date((d as any).lastEditedAt).toISOString() : undefined,
          prbc: componentSlot(units, ['PRBC', 'WB'], tti),
          ffp: componentSlot(units, ['FFP'], tti),
          rdp: componentSlot(units, ['RDP'], tti),
          cryo: componentSlot(units, ['CRYO'], tti),
        };
      });

      return { components, total, totalPages: Math.ceil(total / limitNum) };
    },

    async listBagsToSeparate() {
      const donations = await DonationModel.find({ donationType: 'WHOLE_BLOOD', deletedAt: null })
        .sort({ collectedAt: -1 })
        .lean();

      const donationIds = donations.map((d) => d.donationId);
      const allUnits = await BloodUnitModel.find({
        donationId: { $in: donationIds },
        deletedAt: null,
      }).lean();
      const ttiResults = await TtiResultModel.find({ donationId: { $in: donationIds } }).lean();
      const ttiMap = new Map(ttiResults.map((t) => [t.donationId, t]));
      const inspections = await BagInspectionModel.find({
        bagNo: { $in: donationIds },
        deletedAt: null,
      }).lean();
      const inspectionMap = new Map(inspections.map((i) => [i.bagNo, i]));

      const unitsMap: Record<string, typeof allUnits> = {};
      allUnits.forEach((u) => {
        if (!u.donationId) return;
        (unitsMap[u.donationId] ??= []).push(u);
      });

      return donations
        .map((d) => {
          const units = unitsMap[d.donationId] || [];
          const tti = ttiMap.get(d.donationId);
          const inspection = inspectionMap.get(d.donationId);

          if (!units.some((u) => u.status === 'COLLECTED')) return null;

          const abo = tti?.aboGroupConfirmed || units[0]?.aboGroup || 'O';
          const rh = tti?.rhFactorConfirmed || units[0]?.rhFactor || 'POSITIVE';
          const segmentNo = inspection?.segmentNo || units[0]?.unitDin || units[0]?.unitId || '';
          const separation = (d as any).separation;

          return {
            id: d._id.toString(),
            donationId: d.donationId,
            bagNo: (d as any).bagNo || d.donationId,
            segmentNo: (d as any).segmentNo || segmentNo,
            bloodGroup: abo,
            rh: rh === 'POSITIVE' ? 'Positive' : 'Negative',
            collectionDate: d.collectedAt.toISOString(),
            typeOfBag: (d as any).typeOfBag || 'SB',
            volumeGmMl: d.medicalExam?.volumeMl || 350,
            rpmFirstSpin: separation?.rpmFirstSpin || '',
            rpmSecondSpin: separation?.rpmSecondSpin || '',
            separationTime: separation?.separationTime ? separation.separationTime.toISOString() : '',
            components: units.map((u) => ({
              componentType: u.componentType,
              volumeMl: u.volumeMl,
            })),
          };
        })
        .filter(Boolean);
    },

    async separate({ donationId, componentType, volumeMl, rpmFirstSpin, rpmSecondSpin, separationTime, actorId }) {
      const donation = await resolveDonation(donationId);
      if (!donation) throw new NotFoundError('Donation', donationId);
      const resolvedDonationId = donation.donationId;

      const mappedType = componentType as ComponentType;
      const productCode = PRODUCT_CODE[mappedType] ?? mappedType;

      const existing = await BloodUnitModel.findOne({
        donationId: resolvedDonationId,
        componentType: mappedType,
        deletedAt: null,
      });
      if (existing) throw new ConflictError('Component already separated');

      const requestedVolume = Number(volumeMl) || 250;
      if (requestedVolume <= 0) throw new ValidationError('Volume must be greater than zero');

      const shelfDays = getShelfDays(mappedType);
      const expiresAt = new Date(donation.collectedAt);
      expiresAt.setDate(expiresAt.getDate() + shelfDays);

      await BloodUnitModel.updateOne(
        { donationId: resolvedDonationId, componentType: 'WB', deletedAt: null },
        { deletedAt: new Date(), deletedBy: new Types.ObjectId(actorId) },
      );

      // Centrifuge spin log — one physical separation event per bag, so
      // each separate() call for this donation overwrites with the latest
      // entered values.
      if (rpmFirstSpin !== undefined || rpmSecondSpin !== undefined || separationTime !== undefined) {
        const separationSet: Record<string, unknown> = {};
        if (rpmFirstSpin !== undefined) separationSet['separation.rpmFirstSpin'] = rpmFirstSpin;
        if (rpmSecondSpin !== undefined) separationSet['separation.rpmSecondSpin'] = rpmSecondSpin;
        if (separationTime !== undefined) separationSet['separation.separationTime'] = separationTime;
        await DonationModel.updateOne({ donationId: resolvedDonationId }, { $set: separationSet });
      }

      // Reference unit (ignoring soft-delete) for the original ABO/Rh.
      const refUnit = await BloodUnitModel.findOne({ donationId: resolvedDonationId }).lean();
      let aboGroup = refUnit?.aboGroup;
      let rhFactor = refUnit?.rhFactor;
      if (!aboGroup) {
        const donor = await DonorModel.findById(donation.donor).lean();
        aboGroup = donor?.bloodGroup || 'O';
        rhFactor = donor?.rh === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
      }

      const unitCount = await BloodUnitModel.countDocuments({ donationId: resolvedDonationId });
      const unitId = `${resolvedDonationId}-${productCode}-${unitCount + 1}`;

      return BloodUnitModel.create({
        unitId,
        productCode,
        donationId: resolvedDonationId,
        componentType: mappedType as any,
        aboGroup: aboGroup as any,
        rhFactor: rhFactor as any,
        volumeMl: volumeMl || 250,
        collectedAt: donation.collectedAt,
        expiresAt,
        status: 'COLLECTED',
        statusHistory: [
          { to: 'COLLECTED', event: 'SEPARATE', actor: new Types.ObjectId(actorId), at: new Date() },
        ],
        campId: donation.campId,
        createdBy: new Types.ObjectId(actorId),
        updatedBy: new Types.ObjectId(actorId),
      } as any);
    },

    async separationCompleted({ donationId, signature, actorId }) {
      const donation = await resolveDonation(donationId);
      if (!donation) throw new NotFoundError('Donation', donationId);
      const resolvedDonationId = donation.donationId;

      const tti = await TtiResultModel.findOne({ donationId: resolvedDonationId }).lean();
      const shouldRelease = tti?.releaseDecision === 'released';

      if (shouldRelease) {
        // TTI already cleared: walk the full canonical chain rather than
        // jumping straight to RELEASED — the TTI gate is never bypassed.
        await deps.units.applyEventToDonation(resolvedDonationId, 'BEGIN_TESTING', actorId, [
          'COLLECTED',
        ]);
        await deps.units.applyEventToDonation(resolvedDonationId, 'AWAIT_TTI', actorId, [
          'IN_TESTING',
        ]);
        await deps.units.applyEventToDonation(resolvedDonationId, 'RELEASE', actorId, ['QUARANTINE']);
      } else {
        await deps.units.applyEventToDonation(
          resolvedDonationId,
          'SEPARATION_COMPLETE',
          actorId,
          ['COLLECTED'],
          `Signature: ${signature}`,
        );
      }
      return { donationId: resolvedDonationId };
    },

    async nearExpiry(filters) {
      const { page, limit, days, componentType, status, search } = filters;

      const daysNum = Number(days) || 7;
      const cutoff = new Date(Date.now() + daysNum * 86_400_000);
      const unitFilter: any = { deletedAt: null, expiresAt: { $gt: new Date(), $lte: cutoff } };

      if (componentType) unitFilter.componentType = componentType;
      if (status) {
        if (status === 'in-stock') unitFilter.status = 'RELEASED';
        else if (status === 'reserved') unitFilter.status = 'RESERVED';
        else if (status === 'issued') unitFilter.status = 'ISSUED';
        else if (status === 'discarded') unitFilter.status = 'DISCARDED';
      } else {
        unitFilter.status = 'RELEASED';
      }
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        unitFilter.$or = [
          { donationId: searchRegex },
          { unitId: searchRegex },
          { aboGroup: searchRegex },
        ];
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;
      const skipNum = (pageNum - 1) * limitNum;

      const total = await BloodUnitModel.countDocuments(unitFilter);
      const units = await BloodUnitModel.find(unitFilter)
        .sort({ expiresAt: 1 })
        .skip(skipNum)
        .limit(limitNum)
        .lean();

      const donationIds = units.map((u) => u.donationId).filter(Boolean);
      const donations = await DonationModel.find({ donationId: { $in: donationIds }, deletedAt: null })
        .select('donationId bagNo')
        .lean();
      const donationMap = new Map(donations.map((d) => [d.donationId, d]));
      const ttiResults = await TtiResultModel.find({ donationId: { $in: donationIds } })
        .select('donationId releaseDecision')
        .lean();
      const ttiMap = new Map(ttiResults.map((t) => [t.donationId, t]));

      const components = units.map((u) => {
        const d = donationMap.get(u.donationId);
        const tti = ttiMap.get(u.donationId);

        return {
          id: u._id.toString(),
          componentId: u.unitId,
          type: u.componentType,
          volumeMl: u.volumeMl,
          status: toLegacyUnitStatus(u.status, tti?.releaseDecision),
          expiryDate: u.expiresAt.toISOString(),
          bagNo: d?.bagNo || u.donationId,
          bloodGroup: `${u.aboGroup}${u.rhFactor === 'POSITIVE' ? '+' : '-'}`,
        };
      });

      return { components, total, totalPages: Math.ceil(total / limitNum) };
    },

    async getGroupDetail(id) {
      let donationDoc: any = null;
      if (id && Types.ObjectId.isValid(id)) {
        donationDoc = await DonationModel.findById(id).populate('campId', 'name').lean();
        if (!donationDoc) {
          const unitDoc = await BloodUnitModel.findById(id).lean();
          if (unitDoc) {
            donationDoc = await DonationModel.findOne({
              donationId: unitDoc.donationId,
              deletedAt: null,
            })
              .populate('campId', 'name')
              .lean();
          }
        }
      }
      // Fall back to the human-readable donationId (e.g. "DON-2026-0001"),
      // used by callers like the serology worklist that only have that
      // string, not a Mongo _id.
      if (!donationDoc) {
        donationDoc = await DonationModel.findOne({ donationId: id, deletedAt: null })
          .populate('campId', 'name')
          .lean();
      }
      if (!donationDoc) throw new NotFoundError('Component group', id);

      const units = await BloodUnitModel.find({
        donationId: donationDoc.donationId,
        deletedAt: null,
      }).lean();
      const tti = await TtiResultModel.findOne({ donationId: donationDoc.donationId }).lean();
      const donor = (await mongoose.model('Donor').findById(donationDoc.donor).lean()) as any;

      const findComp = (types: string[]) => {
        const u = units.find((x) => types.includes(x.componentType));
        if (!u) return { status: 'unprepared' };
        return {
          componentId: u.unitId,
          componentType: u.componentType,
          status: toLegacyUnitStatus(u.status, tti?.releaseDecision),
          volumeMl: u.volumeMl,
          expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
          storageLocation: u.storageLocation || 'Main Fridge',
          lotNo: u.productCode,
        };
      };

      const abo = tti?.aboGroupConfirmed || units[0]?.aboGroup || 'O';
      const rh = tti?.rhFactorConfirmed || units[0]?.rhFactor || 'POSITIVE';
      const completionHistory = units[0]?.statusHistory?.find(
        (h: any) => h.event === 'SEPARATION_COMPLETE',
      );
      const separation = (donationDoc as any).separation;

      return {
        bloodBag: {
          donationId: donationDoc.donationId,
          bagNo: donationDoc.bagNo || donationDoc.donationId,
          segmentNo: donationDoc.segmentNo,
          bloodGroup: `${abo}${rh === 'POSITIVE' ? '+' : '-'}`,
          collectionDate: donationDoc.collectedAt.toISOString(),
          status: donationDoc.donorFitness?.isFit ? 'collected' : 'rejected',
          site: donationDoc.campId ? { name: (donationDoc.campId as any).name } : { name: 'Inhouse' },
          donor: donor
            ? {
                name: {
                  firstName: donor.name?.firstName || '',
                  middleName: donor.name?.middleName || '',
                  lastName: donor.name?.lastName || '',
                },
                dob: donor.dob ? donor.dob.toISOString() : '',
                sex: donor.sex,
                phone: donor.phone,
              }
            : null,
          separationVerifiedSignature: completionHistory?.reason?.replace('Signature: ', '') || '',
          separationVerifiedAt: completionHistory?.at ? completionHistory.at.toISOString() : '',
          separationVerifiedBy: completionHistory?.actor
            ? await mongoose.model('User').findById(completionHistory.actor as any).select('name').lean()
            : null,
          rpmFirstSpin: separation?.rpmFirstSpin || '',
          rpmSecondSpin: separation?.rpmSecondSpin || '',
          separationTime: separation?.separationTime ? separation.separationTime.toISOString() : '',
          canEdit: !hasLeftBank(units),
          editReason: (donationDoc as any).lastEditReason || undefined,
          lastEditedAt: (donationDoc as any).lastEditedAt
            ? new Date((donationDoc as any).lastEditedAt).toISOString()
            : undefined,
        },
        prbc: findComp(['PRBC', 'WB']),
        ffp: findComp(['FFP']),
        rdp: findComp(['RDP']),
        cryo: findComp(['CRYO']),
      };
    },

    async getUnitSnapshot(id) {
      const query = Types.ObjectId.isValid(id) ? { _id: id } : { unitId: id };
      return BloodUnitModel.findOne({ ...query, deletedAt: null })
        .select('unitId componentType volumeMl storageLocation expiresAt')
        .lean();
    },

    async getBagSnapshot(donationId) {
      const donation = await resolveDonation(donationId);
      if (!donation) return [];
      return BloodUnitModel.find({ donationId: donation.donationId, deletedAt: null })
        .select('unitId componentType volumeMl')
        .lean();
    },

    async patch(id, fields, actorId) {
      const query = Types.ObjectId.isValid(id) ? { _id: id } : { unitId: id };
      const unit = await BloodUnitModel.findOne({ ...query, deletedAt: null });
      if (!unit) throw new NotFoundError('Component', id);

      if (fields.volumeMl !== undefined) {
        const v = Number(fields.volumeMl);
        if (!Number.isFinite(v) || v <= 0) {
          throw new ValidationError('Volume must be greater than zero');
        }
        unit.volumeMl = v;
      }
      if (fields.storageLocation !== undefined) {
        unit.storageLocation = (fields.storageLocation.trim() || null) as any;
      }
      if (fields.expiryDate) {
        const d = new Date(fields.expiryDate);
        if (Number.isNaN(d.getTime())) throw new ValidationError('Invalid expiry date');
        unit.expiresAt = d;
      }
      unit.updatedBy = new Types.ObjectId(actorId);
      await unit.save();
      return unit;
    },

    async patchBag(donationId, { components, rpmFirstSpin, rpmSecondSpin, separationTime, editReason }, actorId) {
      const donation = await resolveDonation(donationId);
      if (!donation) throw new NotFoundError('Donation', donationId);
      const resolvedDonationId = donation.donationId;

      if (!editReason || !editReason.trim()) {
        throw new ValidationError('A reason is required to edit this bag');
      }

      const existingUnits = await BloodUnitModel.find({
        donationId: resolvedDonationId,
        deletedAt: null,
      });
      if (hasLeftBank(existingUnits as any)) {
        throw new ConflictError(
          'This bag has an issued component — its separation details are now permanently read-only',
        );
      }

      const unitsById = new Map(existingUnits.map((u) => [u.unitId, u]));

      // Guard against two edited slots landing on the same component type.
      const mappedTypes = components.map((c) => c.componentType as ComponentType);
      if (new Set(mappedTypes).size !== mappedTypes.length) {
        throw new ValidationError('Each component type may only appear once per bag');
      }

      const actorObjId = new Types.ObjectId(actorId);

      for (let i = 0; i < components.length; i++) {
        const entry = components[i]!;
        const unit = unitsById.get(entry.unitId);
        if (!unit) throw new NotFoundError('Component', entry.unitId);

        const newVolume = Number(entry.volumeMl);
        if (!Number.isFinite(newVolume) || newVolume <= 0) {
          throw new ValidationError('Volume must be greater than zero');
        }
        unit.volumeMl = newVolume;

        const newType = mappedTypes[i]!;
        if (newType !== unit.componentType) {
          unit.componentType = newType as any;
          unit.productCode = PRODUCT_CODE[newType] ?? newType;
          const shelfDays = getShelfDays(newType, unit.specialAttributes as any);
          const expiresAt = new Date(donation.collectedAt);
          expiresAt.setDate(expiresAt.getDate() + shelfDays);
          unit.expiresAt = expiresAt;
        }

        if (entry.storageLocation !== undefined) {
          unit.storageLocation = (entry.storageLocation.trim() || null) as any;
        }
        if (entry.expiryDate) {
          unit.expiresAt = entry.expiryDate;
        }

        unit.updatedBy = actorObjId;
        await unit.save();
      }

      const separationSet: Record<string, unknown> = {
        lastEditReason: editReason.trim(),
        lastEditedAt: new Date(),
        lastEditedBy: actorObjId,
        updatedBy: actorObjId,
      };
      if (rpmFirstSpin !== undefined) separationSet['separation.rpmFirstSpin'] = rpmFirstSpin;
      if (rpmSecondSpin !== undefined) separationSet['separation.rpmSecondSpin'] = rpmSecondSpin;
      if (separationTime !== undefined) separationSet['separation.separationTime'] = separationTime;
      await DonationModel.updateOne({ donationId: resolvedDonationId }, { $set: separationSet });
    },
  };
}
