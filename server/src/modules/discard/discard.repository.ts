// Clinical BloodUnit discard register — distinct from the procurement
// `bag-discard` module (which discards empty/damaged bags before use).
// No model of its own: reads/writes BloodUnit/Donation/TtiResult owned
// by their respective modules, same shape as `mis`/`component`. Empty
// (unfilled) bags discarded from this screen by segment + batch DO get a
// `bag-discard` record (source: 'CLINICAL') and are merged into list().
import { Types } from 'mongoose';
import { DonationModel } from '@/modules/donation/donation.model';
import { CampDonationRecordModel } from '@/modules/donation/camp-donation-record.model';
import { findAcrossDonations } from '@/modules/donation/donation-collections.util';
import { CampModel } from '@/modules/camp/camp.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { BagDiscardModel } from '@/modules/bag-discard/bag-discard.model';
import { TERMINAL_STATUSES } from '@/modules/unit/unit.state-machine';
import { invalidate } from '@/core/cache';
import { NotFoundError, ValidationError, ConflictError } from '@/shared/errors';
import { cascadeRestore, runInCascadeTransaction } from '@/shared/utils/cascade-delete';
import { donationNode, campDonationNode, donorCascadeNode } from '@/shared/cascade-registry';
import type { UnitRepo } from '@/modules/unit/unit.repository';
import type { BagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import type { TtiService } from '@/modules/tti/tti.service';
import type { TtiTestEntryInput } from '@/modules/tti/tti.repository';
import type { TtiResult } from '@/shared/enums';

export interface DiscardListFilters {
  page?: number;
  limit?: number;
  search?: string;
  itemType?: string;
  /** manual = staff discard; system = auto EXPIRED / CASCADE_DELETED. */
  discardType?: 'manual' | 'system' | 'all';
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface DiscardCreateInput {
  bagNo?: string;
  batchNo?: string;
  segmentNo?: string;
  components?: string[];
  reason: string;
  description?: string;
  ttiResults?: Record<string, string>;
  actorId: string;
}

export interface BagComponentInfo {
  batchNo: string;
  segmentNo: string;
  components: Array<{ componentType: string; unitId: string; status: string }>;
}

export interface DiscardRepo {
  list(filters: DiscardListFilters): Promise<{ data: any[]; total: number; totalPages: number }>;
  create(input: DiscardCreateInput): Promise<{ unitsDiscarded: number; bagNo: string }>;
  getBagComponents(bagNo: string): Promise<BagComponentInfo>;
  /**
   * Undo a unit that was auto-DISCARDED as a side effect of cascade-deleting
   * its upstream donation/donor (see cascade-registry.ts bloodUnitNode) —
   * restores the whole batch it was deleted with (donor or donation,
   * whichever was the actual root), not just this one unit in isolation.
   */
  restoreCascadeDiscarded(
    unitId: string,
    actorId: string,
  ): Promise<{ restoredScope: 'donor' | 'donation' }>;
}

const SYSTEM_DISCARD_REASONS = new Set(['EXPIRED', 'CASCADE_DELETED']);

function isSystemDiscard(status: string, discardReason?: string | null): boolean {
  return status === 'EXPIRED' || (!!discardReason && SYSTEM_DISCARD_REASONS.has(discardReason));
}

function generateClinicalBagDiscardId(): string {
  const now = new Date();
  const yyyymmdd = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(
    now.getUTCDate(),
  ).padStart(2, '0')}`;
  const rand = new Types.ObjectId().toHexString().slice(-4).toUpperCase();
  return `DIS-${yyyymmdd}-${rand}`;
}

export function createDiscardRepo(deps: {
  units: UnitRepo;
  ttiService: TtiService;
  bagStock: BagStockRepo;
}): DiscardRepo {
  async function resolveDonationByBag(bagNo: string) {
    const filter = { $or: [{ donationId: bagNo }, { bagNo }], deletedAt: null };
    return (
      (await DonationModel.findOne(filter)) ?? (await CampDonationRecordModel.findOne(filter))
    );
  }

  return {
    async list(filters) {
      const { page, limit, search, itemType, discardType, fromDate, toDate, sortBy, order } =
        filters;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;
      const skipNum = (pageNum - 1) * limitNum;
      const sortDir = order === 'asc' ? 1 : -1;
      let sortField = sortBy || 'updatedAt';
      if (sortField === 'discardedAt') sortField = 'updatedAt';

      // ── 1. Discarded / auto-expired blood units ──────────────────────
      const unitFilter: any = {
        status: { $in: ['DISCARDED', 'EXPIRED'] },
        $and: [{ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }],
      };

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchingDonations = await findAcrossDonations<{ donationId: string }>(
          {
            $and: [
              { $or: [{ donationId: searchRegex }, { bagNo: searchRegex }] },
              { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
            ],
          },
          { donationId: 1 },
        );
        const matchedDonationIds = matchingDonations.map((d) => d.donationId);
        unitFilter.$and.push({
          $or: [
            { donationId: { $in: matchedDonationIds } },
            { donationId: searchRegex },
            { unitId: searchRegex },
          ],
        });
      }

      if (fromDate || toDate) {
        unitFilter.updatedAt = {};
        if (fromDate) unitFilter.updatedAt.$gte = new Date(fromDate);
        if (toDate) unitFilter.updatedAt.$lte = new Date(toDate);
      }

      const units = await BloodUnitModel.find(unitFilter).sort({ [sortField]: sortDir }).lean();

      const donationIds = units.map((u) => u.donationId).filter(Boolean);
      const rawDonations = await findAcrossDonations<any>({
        donationId: { $in: donationIds },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      });
      const donorIds = [...new Set(rawDonations.map((d) => d.donor).filter(Boolean))];
      const campIds = [...new Set(rawDonations.map((d) => d.campId).filter(Boolean))];
      const [donorDocs, campDocs] = await Promise.all([
        donorIds.length ? DonorModel.find({ _id: { $in: donorIds } }).lean() : Promise.resolve([]),
        campIds.length ? CampModel.find({ _id: { $in: campIds } }).lean() : Promise.resolve([]),
      ]);
      const donorById = new Map(donorDocs.map((d) => [d._id.toString(), d]));
      const campById = new Map(campDocs.map((c) => [c._id.toString(), c]));
      const donations = rawDonations.map((d) => ({
        ...d,
        donor: d.donor ? donorById.get(d.donor.toString()) : undefined,
        campId: d.campId ? campById.get(d.campId.toString()) : undefined,
      }));
      const ttis = await TtiResultModel.find({ donationId: { $in: donationIds } }).lean();

      const donationMap = new Map<string, any>();
      donations.forEach((d) => {
        if (d.donationId) donationMap.set(d.donationId, d);
      });
      const ttiMap = new Map<string, any>();
      ttis.forEach((t) => {
        if (t.donationId) ttiMap.set(t.donationId, t);
      });

      const nowMs = Date.now();

      let unitRows = units.map((u) => {
        const discardHistory = u.statusHistory?.find((h) => h.to === 'DISCARDED' || h.to === 'EXPIRED');
        const donation = donationMap.get(u.donationId);
        const donor = donation?.donor as any;
        const tti = ttiMap.get(u.donationId);
        const systemDiscard = isSystemDiscard(u.status, u.discardReason);
        const expiresAtMs = u.expiresAt ? u.expiresAt.getTime() : 0;

        let testResultsStr = 'No tests performed';
        if (tti && tti.tests && tti.tests.length > 0) {
          testResultsStr = tti.tests
            .map((t: any) => {
              let tName = t.testName;
              if (tName === 'HBSAG') tName = 'HBsAg';
              else if (tName === 'SYPHILIS') tName = 'VDRL';
              else if (tName === 'MALARIA') tName = 'MP';
              let result = t.result;
              if (result === 'NEGATIVE') result = 'Negative';
              else if (result === 'REACTIVE') result = 'Reactive';
              else if (result === 'INDETERMINATE') result = 'Indeterminate';
              return `${tName}: ${result}`;
            })
            .join(', ');
        } else if (tti) {
          testResultsStr = `Release Decision: ${tti.releaseDecision}`;
        }

        const reason = u.discardReason || (u.status === 'EXPIRED' ? 'EXPIRED' : 'QC_FAIL');

        return {
          id: u._id.toString(),
          bagNo: donation?.bagNo || u.donationId,
          segmentNo: donation?.segmentNo || '',
          componentId: u.unitId,
          componentType: u.componentType,
          itemName: u.componentType === 'WB' ? 'Whole Blood' : u.componentType,
          itemType: u.componentType === 'WB' ? 'Bag' : 'Component',
          reason,
          discardType: systemDiscard ? 'SYSTEM' : 'MANUAL',
          description: u.discardNotes || '',
          discardedAt: discardHistory ? discardHistory.at.toISOString() : u.updatedAt.toISOString(),
          _sortAt: discardHistory ? discardHistory.at.getTime() : u.updatedAt.getTime(),
          itemId: u.unitId,
          siteId: donation?.campId ? (donation.campId as any).name : 'In-House',
          createdAt: u.createdAt.toISOString(),
          segmentId: u.unitDin || u.unitId,
          collectionDate: donation?.collectedAt
            ? donation.collectedAt.toISOString()
            : u.collectedAt.toISOString(),
          expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
          restorable: reason === 'CASCADE_DELETED' && !u.affected && !!u.deleteBatchId && expiresAtMs > nowMs,
          restoreDeadline: u.expiresAt ? u.expiresAt.toISOString() : '',
          status: 'DISCARDED',
          initialVitals: {
            bp: donation?.medicalExam?.bloodPressure
              ? `${donation.medicalExam.bloodPressure.systolic}/${donation.medicalExam.bloodPressure.diastolic}`
              : 'N/A',
            hb: donation?.medicalExam?.hbGdl ?? 'N/A',
            weightKg: donation?.medicalExam?.weightKg ?? 'N/A',
            pulse: donation?.medicalExam?.pulseBpm ?? 'N/A',
            tempC: donation?.medicalExam?.temperatureCelsius ?? 'N/A',
          },
          donorId: donor?.donorId || 'N/A',
          firstName: donor?.name?.firstName || 'N/A',
          middleName: donor?.name?.middleName || '',
          lastName: donor?.name?.lastName || 'N/A',
          dob: donor?.dob
            ? donor.dob instanceof Date
              ? donor.dob.toISOString().slice(0, 10)
              : new Date(donor.dob).toISOString().slice(0, 10)
            : 'N/A',
          sex: donor?.sex || 'N/A',
          phone: donor?.phone || 'N/A',
          email: donor?.email || 'N/A',
          bloodGroup: donor?.bloodGroup || 'N/A',
          rh: donor?.rh === 'NEGATIVE' ? 'Negative' : 'Positive',
          testResults: testResultsStr,
        };
      });

      // ── 2. Empty-bag clinical discards (bag-discard, source CLINICAL) ─
      const bagDiscardFilter: any = { deletedAt: null, source: 'CLINICAL' };
      if (fromDate || toDate) {
        bagDiscardFilter.discardDate = {};
        if (fromDate) bagDiscardFilter.discardDate.$gte = new Date(fromDate);
        if (toDate) bagDiscardFilter.discardDate.$lte = new Date(toDate);
      }
      if (search) {
        const rx = new RegExp(search, 'i');
        bagDiscardFilter.$or = [{ batchNumber: rx }, { segmentNo: rx }, { discardId: rx }];
      }
      let emptyBagRows = (await BagDiscardModel.find(bagDiscardFilter).lean()).map((b: any) => ({
        id: b._id.toString(),
        bagNo: '-',
        segmentNo: b.segmentNo || '-',
        componentId: '-',
        componentType: '-',
        itemName: b.bagType,
        itemType: 'Empty Bag',
        reason: b.reason,
        discardType: 'MANUAL',
        description: b.reasonDetail || '',
        batchNo: b.batchNumber,
        discardedAt: (b.discardDate as Date).toISOString(),
        _sortAt: (b.discardDate as Date).getTime(),
        itemId: b.discardId,
        siteId: 'In-House',
        createdAt: (b.createdAt as Date).toISOString(),
        segmentId: b.segmentNo || '-',
        collectionDate: '',
        expiryDate: '',
        restorable: false,
        restoreDeadline: '',
        status: 'DISCARDED',
        initialVitals: { bp: 'N/A', hb: 'N/A', weightKg: 'N/A', pulse: 'N/A', tempC: 'N/A' },
        donorId: 'N/A',
        firstName: 'N/A',
        middleName: '',
        lastName: 'N/A',
        dob: 'N/A',
        sex: 'N/A',
        phone: 'N/A',
        email: 'N/A',
        bloodGroup: 'N/A',
        rh: 'N/A',
        testResults: 'No tests performed',
      }));

      // ── 3. Filter (itemType, discardType) + combine + paginate ───────
      if (discardType && discardType !== 'all') {
        const want = discardType === 'system' ? 'SYSTEM' : 'MANUAL';
        unitRows = unitRows.filter((r) => r.discardType === want);
        emptyBagRows = want === 'SYSTEM' ? [] : emptyBagRows;
      }
      if (itemType) {
        unitRows = unitRows.filter((r) => r.itemType === itemType);
        if (itemType !== 'Empty Bag') emptyBagRows = [];
      }

      const combined = [...unitRows, ...emptyBagRows].sort((a, b) =>
        sortDir === 1 ? a._sortAt - b._sortAt : b._sortAt - a._sortAt,
      );
      const total = combined.length;
      const pageData = combined.slice(skipNum, skipNum + limitNum).map((r) => {
        const { _sortAt, ...rest } = r;
        return rest;
      });

      return { data: pageData, total, totalPages: Math.ceil(total / limitNum) };
    },

    async getBagComponents(bagNo) {
      const donation = await resolveDonationByBag(bagNo);
      if (!donation) throw new NotFoundError('Donation matching bag number', bagNo);
      const units = await BloodUnitModel.find({
        donationId: donation.donationId,
        deletedAt: null,
        status: { $nin: [...TERMINAL_STATUSES] },
      })
        .select('unitId componentType status')
        .lean();
      return {
        batchNo: (donation as any).lotNo || '',
        segmentNo: (donation as any).segmentNo || '',
        components: units.map((u) => ({
          componentType: u.componentType,
          unitId: u.unitId,
          status: u.status,
        })),
      };
    },

    async create({ bagNo, batchNo, segmentNo, components, reason, description, ttiResults, actorId }) {
      // ── Empty (unfilled) bag: no bag number, discarded by segment + batch ──
      if (!bagNo) {
        if (!batchNo || !segmentNo) {
          throw new ValidationError('Segment number and batch number are required for an empty bag');
        }
        const matches = await deps.bagStock.findByBatch(batchNo);
        if (matches.length === 0) throw new NotFoundError('Bag stock batch', batchNo);
        if (matches.length > 1) {
          throw new ConflictError(
            `Batch ${batchNo} matches multiple bag types — cannot resolve which to reduce`,
          );
        }
        const stock = matches[0]!;
        if (stock.closingStock < 1) {
          throw new ConflictError(`Batch ${batchNo} has no available stock to discard`);
        }
        await deps.bagStock.incrementDiscarded(stock.id, 1, actorId);
        await BagDiscardModel.create({
          discardId: generateClinicalBagDiscardId(),
          discardDate: new Date(),
          stockId: new Types.ObjectId(stock.id),
          bagType: stock.bagType,
          batchNumber: stock.batchNumber,
          quantity: 1,
          reason,
          reasonDetail: description,
          source: 'CLINICAL',
          segmentNo,
          createdBy: new Types.ObjectId(actorId),
          updatedBy: new Types.ObjectId(actorId),
        });
        await invalidate('inventory:*');
        return { unitsDiscarded: 1, bagNo: `Segment ${segmentNo}` };
      }

      // ── Bag with a number: discard selected in-stock component(s) ──
      const donation = await resolveDonationByBag(bagNo);
      if (!donation) throw new NotFoundError('Donation matching bag number', bagNo);

      const allUnits = await BloodUnitModel.find({
        donationId: donation.donationId,
        deletedAt: null,
        status: { $nin: [...TERMINAL_STATUSES] },
      });
      if (allUnits.length === 0) {
        throw new NotFoundError('In-stock blood units for donation', donation.donationId);
      }

      let targetUnits = allUnits;
      if (components && components.length > 0) {
        targetUnits = allUnits.filter((u) => components.includes(u.componentType));
        const missing = components.filter(
          (c) => !allUnits.some((u) => u.componentType === c),
        );
        if (missing.length > 0) {
          throw new ValidationError(
            `Component(s) not in stock for this bag: ${missing.join(', ')}`,
          );
        }
      } else if (allUnits.length > 1) {
        throw new ValidationError('This bag has multiple components in stock — select which to discard', [
          {
            code: 'custom',
            path: ['components'],
            message: 'requiresComponentSelection',
          } as never,
        ]);
      }

      const manualDiscardReason = `Manually discarded via discard portal. ${description || ''} (segment ${segmentNo || (donation as any).segmentNo || 'N/A'}, batch ${batchNo || (donation as any).lotNo || 'N/A'})`;

      if (reason === 'TTI_POSITIVE' && ttiResults) {
        const mappedTests: TtiTestEntryInput[] = (
          ['HIV', 'HBSAG', 'HCV', 'SYPHILIS', 'MALARIA'] as const
        ).map((testName) => ({
          testName,
          method: 'ELISA',
          result: (ttiResults[testName] as TtiResult) || 'NEGATIVE',
          performedAt: new Date(),
        }));
        await deps.ttiService.recordAndFinalize(donation.donationId, mappedTests, actorId);
      } else {
        for (const unit of targetUnits) {
          await deps.units.applyEvent({
            unitId: unit.unitId,
            event: 'DISCARD',
            actorId,
            reason: manualDiscardReason,
            set: {
              discardReason: reason as never,
              discardNotes: description || undefined,
              reservedFor: null,
              reservedAt: null,
              reservedUntil: null,
            } as any,
          });
        }
      }

      for (const unit of targetUnits) {
        const reqs = await RequisitionModel.find({ 'matchedUnits.unitId': unit.unitId });
        for (const r of reqs) {
          r.matchedUnits = r.matchedUnits.filter((mu: any) => mu.unitId !== unit.unitId) as any;
          if (
            r.matchedUnits.length === 0 &&
            ['MATCHED', 'CROSSMATCHED', 'APPROVED'].includes(r.status)
          ) {
            r.status = 'PENDING';
          }
          await r.save();
        }
      }

      if (segmentNo) (donation as any).segmentNo = segmentNo;
      if (batchNo) (donation as any).lotNo = batchNo;
      await donation.save();

      await invalidate('inventory:*');

      return { unitsDiscarded: targetUnits.length, bagNo };
    },

    async restoreCascadeDiscarded(unitId, actorId) {
      const unit = await BloodUnitModel.findOne({ unitId, status: 'DISCARDED' });
      if (!unit) throw new NotFoundError('Discarded blood unit', unitId);
      if (unit.affected) {
        throw new ConflictError(
          'This unit is preserved as an affected record (already part of a completed downstream workflow) and cannot be auto-restored — review it from the Recycle Bin instead.',
        );
      }
      if (!unit.deleteBatchId) {
        throw new ConflictError(
          'This unit was not discarded by a cascade delete of its donation/donor, so it cannot be restored from here.',
        );
      }
      if (unit.expiresAt && unit.expiresAt.getTime() <= Date.now()) {
        throw new ConflictError(
          "This unit's blood has already passed its expiry date and cannot be returned to stock.",
        );
      }

      const donation =
        (await DonationModel.findOne({ donationId: unit.donationId })) ??
        (await CampDonationRecordModel.findOne({ donationId: unit.donationId }));
      if (!donation) throw new NotFoundError('Donation for unit', unit.donationId);
      const donationCascadeNode = donation.campId ? campDonationNode : donationNode;

      const donor = await DonorModel.findById(donation.donor);
      const rootWasDonor = Boolean(
        donor && donor.deletedAt && donor.deleteBatchId === unit.deleteBatchId,
      );

      await runInCascadeTransaction((session) =>
        rootWasDonor
          ? cascadeRestore(donorCascadeNode, donor!._id.toString(), actorId, session)
          : cascadeRestore(donationCascadeNode, donation._id.toString(), actorId, session),
      );

      await invalidate('inventory:*');

      return { restoredScope: rootWasDonor ? 'donor' : 'donation' };
    },
  };
}
