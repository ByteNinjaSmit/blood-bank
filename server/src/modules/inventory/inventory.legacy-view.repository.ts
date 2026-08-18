// Legacy /api/inventory stock view + bulk unreserve/send-to-storage
// actions. Distinct from the newer `inventory.service.ts` (which only
// wraps `unit.repository`'s summary/near-expiry/select/reserve) — this
// is the heavier, donor/hospital-joined stock register the Stock/
// Reserve/Issue/NearExpiry pages actually call. No model of its own,
// same model-less cross-module shape as `mis`/`component`/`discard`.
//
// Note: `sendToStorage` issues units directly from RELEASED, a
// transition the unit state machine doesn't model (it only knows
// RESERVED/CROSSMATCHED -> ISSUED) — this mirrors the original
// behavior exactly and is a pre-existing gap, not something
// introduced by this refactor.
import { Types } from 'mongoose';
import {
  findAcrossDonations,
  findOneAcrossDonations,
} from '@/modules/donation/donation-collections.util';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { invalidate } from '@/core/cache';
import { ValidationError, NotFoundError } from '@/shared/errors';
import type { UnitRepo } from '@/modules/unit/unit.repository';

export interface StockListFilters {
  page?: number;
  limit?: number;
  status?: string;
  componentType?: string;
  siteId?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  storageLocation?: string;
  dispatchType?: string;
  bloodGroup?: string;
  rh?: string;
  expiryFrom?: string;
  expiryTo?: string;
  source?: string;
  purpose?: 'REQUISITION' | 'RESERVATION';
  /** Only units whose donation's TTI result was ever edited/retested. */
  ttiRetest?: boolean;
}

export interface SendToStorageInput {
  location?: string;
  otherLocationName?: string;
  bags: Array<{ bagIds: string[] }>;
  sentDate?: string | null;
  actorId: string;
}

export interface UpdateStorageInput {
  id: string;
  location?: string;
  otherLocationName?: string;
  actorId: string;
}

export interface StorageUnitSummary {
  id: string;
  bagNo: string;
  storageLocation?: string;
  componentType?: string;
  aboGroup?: string;
  rhFactor?: string;
  segmentNo?: string;
}

export interface InventoryLegacyViewRepo {
  listStock(
    filters: StockListFilters,
  ): Promise<{ data: any[]; total: number; totalPages: number; page: number; limit: number }>;
  unreserve(
    inventoryIds: string[],
    actorId: string,
    reason: string,
  ): Promise<Array<{ unitId: string; componentType: string; bagNo: string }>>;
  sendToStorage(input: SendToStorageInput): Promise<{ skipped: string[]; message: string }>;
  updateStorage(input: UpdateStorageInput): Promise<StorageUnitSummary>;
  returnFromStorage(id: string, actorId: string): Promise<StorageUnitSummary>;
}

export function createInventoryLegacyViewRepo(deps: { units: UnitRepo }): InventoryLegacyViewRepo {
  return {
    async listStock(filters) {
      const {
        page,
        limit,
        status,
        componentType,
        siteId,
        search,
        sortBy,
        order,
        storageLocation,
        dispatchType,
        bloodGroup,
        rh,
        expiryFrom,
        expiryTo,
        source,
        purpose,
        ttiRetest,
      } = filters;

      const unitFilter: any = {
        $and: [{ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }],
      };

      // A loan-taken bag (BulkTransfer TAKE_LOAN) is a real BloodUnit —
      // createUnitsForTakeLoan creates one on intake, tagged via
      // `loanedFrom`. It must show up here exactly like any other bag (via
      // the query below), just carrying the loan tag/badge — never as a
      // second, separately-constructed row built straight from the
      // BulkTransfer document. (A parallel `loanRows` merge used to build
      // that second row for every loan bag whenever source was 'all' or
      // 'loan' — the exact cause of loan bags appearing twice in Stock.)
      if (source === 'own') {
        unitFilter['loanedFrom.transferId'] = { $exists: false };
      } else if (source === 'loan') {
        unitFilter['loanedFrom.transferId'] = { $exists: true };
      }

      if (status) {
        if (status === 'in-stock') unitFilter.status = 'RELEASED';
        else if (status === 'reserved') unitFilter.status = { $in: ['RESERVED', 'CROSSMATCHED'] };
        else if (status === 'issued') unitFilter.status = 'ISSUED';
        // Units pulled back off the shelf (e.g. a shadeness/indeterminate
        // TTI hold) — visible here for tracking, but never selectable()
        // for requisition since that query only reads RELEASED units.
        else if (status === 'quarantine') unitFilter.status = 'QUARANTINE';
      } else {
        unitFilter.status = { $in: ['RELEASED', 'RESERVED', 'CROSSMATCHED'] };
      }

      if (componentType) {
        unitFilter.componentType = componentType;
      }

      if (purpose) {
        const reqIds = await RequisitionModel.find({ purpose }).select('_id').lean();
        unitFilter.reservedFor = { $in: reqIds.map((r) => r._id) };
      }

      if (ttiRetest) {
        const retestDonationIds = await TtiResultModel.distinct('donationId', {
          editReason: { $exists: true, $nin: [null, ''] },
        });
        unitFilter.donationId = { $in: retestDonationIds };
      }

      if (siteId) unitFilter.campId = new Types.ObjectId(siteId);
      if (bloodGroup) unitFilter.aboGroup = bloodGroup;
      if (rh)
        unitFilter.rhFactor = rh === 'Positive' || rh === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
      if (expiryFrom || expiryTo) {
        unitFilter.expiresAt = {};
        if (expiryFrom) unitFilter.expiresAt.$gte = new Date(expiryFrom);
        if (expiryTo) unitFilter.expiresAt.$lte = new Date(expiryTo);
      }

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
            { aboGroup: searchRegex },
          ],
        });
      }

      if (status === 'issued') {
        if (dispatchType === 'CLINICAL_INDICATION') {
          unitFilter.clinicalIndicationPatient = { $exists: true, $ne: null };
        } else if (storageLocation === 'ALL') {
          unitFilter.storageLocation = { $ne: null };
        } else if (storageLocation) {
          unitFilter.storageLocation = new RegExp(storageLocation, 'i');
        }
        // Default "Issue Stock" view (no dispatchType/storageLocation
        // filter): every issued bag, full stop — plain hospital/
        // requisition issues, Storage-batch dispatches, Clinical
        // Indication / Disease issues, and Bulk Transfer (Given Loan)
        // bags all belong here. Storage/Disease/Bulk Transfer each also
        // get their own dedicated tab with a narrower filtered view.
      } else {
        if (storageLocation) unitFilter.storageLocation = new RegExp(storageLocation, 'i');
        if (dispatchType === 'CLINICAL_INDICATION') {
          unitFilter.clinicalIndicationPatient = { $exists: true, $ne: null };
        }
      }

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;
      const skipNum = (pageNum - 1) * limitNum;
      const sortDir = order === 'asc' ? 1 : -1;
      const sortField = sortBy || 'createdAt';
      // bagNo lives on the joined donation record, not on BloodUnit, so it
      // can't be sorted at the Mongoose query level — fetch unpaginated
      // (like the own+loan merge path already does) and sort in memory
      // once the donation join below has populated bag.bagNo.
      const bagNoSort = sortBy === 'bagNo';

      const total = await BloodUnitModel.countDocuments(unitFilter);
      const query = BloodUnitModel.find(unitFilter).populate({
        path: 'reservedFor',
        populate: [
          { path: 'hospitalId', select: 'name' },
          { path: 'patientId', select: 'name dob sex' },
        ],
      });
      if (!bagNoSort) query.sort({ [sortField]: sortDir });
      const units = await query
        .skip(bagNoSort ? 0 : skipNum)
        .limit(bagNoSort ? 5000 : limitNum)
        .lean();

      const donationIds = units.map((u) => u.donationId).filter(Boolean);
      const donations = await findAcrossDonations(
        {
          donationId: { $in: donationIds },
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        },
        { donationId: 1, bagNo: 1, segmentNo: 1, lotNo: 1, typeOfBag: 1, collectedAt: 1, donor: 1, donationType: 1 },
      );

      // TTI retest flag per donation — whether this bag's TTI result was
      // ever edited/retested (e.g. a shadeness hold later cleared).
      const ttiResults = await TtiResultModel.find({ donationId: { $in: donationIds } })
        .select('donationId editReason lastEditedAt')
        .lean();
      const ttiRetestMap = new Map(
        ttiResults
          .filter((t) => t.editReason)
          .map((t) => [t.donationId, t.lastEditedAt ? t.lastEditedAt.toISOString() : null]),
      );

      const donorIds = donations.map((d: any) => d.donor).filter(Boolean);
      const donors = (await DonorModel.find({ _id: { $in: donorIds } })
        .select('_id donorId name phone email bloodGroup rh')
        .lean()) as any[];
      const donorInfoMap = new Map<string, any>();
      donors.forEach((d) => {
        const fullName = d.name
          ? [d.name.firstName, d.name.middleName, d.name.lastName].filter(Boolean).join(' ')
          : 'Unknown';
        donorInfoMap.set(d._id.toString(), {
          name: fullName,
          donorId: d.donorId,
          phone: d.phone,
          email: d.email,
          bloodGroup: d.bloodGroup,
          rh: d.rh === 'NEGATIVE' ? 'Negative' : 'Positive',
        });
      });

      const donationMap = new Map<string, any>();
      donations.forEach((d: any) => {
        if (d.donationId && d.bagNo) {
          const donorInfo = d.donor ? donorInfoMap.get(d.donor.toString()) : undefined;
          donationMap.set(d.donationId, {
            bagNo: d.bagNo,
            segmentNo: d.segmentNo,
            batchNo: d.lotNo,
            typeOfBag: d.typeOfBag || undefined,
            collectedAt: d.collectedAt,
            donorName: donorInfo?.name || 'Unknown',
            donorId: donorInfo?.donorId,
            donorPhone: donorInfo?.phone,
            donorEmail: donorInfo?.email,
            donationType: d.donationType,
          });
        }
      });

      // Bags given out on loan (BulkTransfer transferType=GIVE_LOAN) are
      // ISSUED units with no storageLocation/clinicalIndicationPatient of
      // their own — the "who took it" info lives on the BulkTransfer doc,
      // not the BloodUnit. Look it up once per page so the Issue Stock
      // tab can show "<company name> — Given Loan" instead of "—".
      const issuedUnitIds = units.filter((u) => u.status === 'ISSUED').map((u) => u._id);
      const givenLoanMap = new Map<string, string>();
      if (issuedUnitIds.length > 0) {
        const givenLoanTransfers = await BulkTransferModel.find({
          transferType: 'GIVE_LOAN',
          deletedAt: null,
          'items.unitId': { $in: issuedUnitIds },
        })
          .select('bloodBankName items.unitId')
          .lean();
        givenLoanTransfers.forEach((t: any) => {
          (t.items || []).forEach((it: any) => {
            if (it.unitId) givenLoanMap.set(it.unitId.toString(), t.bloodBankName);
          });
        });
      }

      const data = units.map((u) => {
        let legacyStatus = 'in-stock';
        if (u.status === 'RELEASED') legacyStatus = 'in-stock';
        else if (u.status === 'RESERVED' || u.status === 'CROSSMATCHED') legacyStatus = 'reserved';
        else if (u.status === 'ISSUED') legacyStatus = 'issued';
        else if (u.status === 'QUARANTINE') legacyStatus = 'quarantine';

        const legacyType: string = u.componentType;

        let hospitalName = '—';
        let patientName = '—';
        let patientAge = '';
        let patientSex = '—';
        let requisitionObj: any = null;

        if (u.reservedFor && typeof u.reservedFor === 'object') {
          const reqDoc = u.reservedFor as any;
          if (reqDoc.hospitalId && typeof reqDoc.hospitalId === 'object') {
            hospitalName = reqDoc.hospitalId.name || '—';
          }
          if (reqDoc.patientId && typeof reqDoc.patientId === 'object') {
            const patientDoc = reqDoc.patientId;
            patientName = patientDoc.name || '—';
            patientSex = patientDoc.sex || '—';
            if (patientDoc.dob) {
              const birthDate = new Date(patientDoc.dob);
              const today = new Date();
              let calculatedAge = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
              patientAge = String(calculatedAge);
            }
          }
          requisitionObj = {
            _id: reqDoc._id ? reqDoc._id.toString() : undefined,
            requisitionId: reqDoc.requisitionId,
            doctorName: reqDoc.doctorName || reqDoc.clinicianName,
            requiredAt: reqDoc.requiredAt ? reqDoc.requiredAt.toISOString() : undefined,
            purpose: reqDoc.purpose || 'REQUISITION',
            patient: reqDoc.patient,
          };
        }

        const donObj = donationMap.get(u.donationId);
        // Loaned-in bags (BulkTransfer TAKE_LOAN) share one synthetic
        // donationId across the whole batch and have no real Donation
        // record — their real bagNo/segmentNo (captured on intake) always
        // wins over the donation lookup, same as unit.repository.ts's
        // availableForSelection() and requisition.view.ts's enrichRequisition().
        // Without this, every bag in a take-loan batch collapsed to the same
        // "LOAN-<transferId>" label and was effectively unusable in pickers.
        const loanedFrom = (u as any).loanedFrom;
        const displayBagNo = loanedFrom?.bagNo || donObj?.bagNo || u.donationId;
        const segmentNo = loanedFrom?.segmentNo || donObj?.segmentNo || u.unitDin || u.unitId || '—';
        const typeOfBag = donObj?.typeOfBag || 'SB';

        const givenLoanCompany = givenLoanMap.get(u._id.toString());
        if (u.storageLocation) {
          hospitalName = u.storageLocation;
        } else if (u.clinicalIndicationPatient) {
          const p = u.clinicalIndicationPatient;
          const diseaseLabel =
            p.disease === 'THALASSEMIA'
              ? 'Thalassemia'
              : p.disease === 'SICKLE_CELL_ANAEMIA'
                ? 'Sickle Cell Anaemia'
                : p.otherDiseaseName || 'Other';
          hospitalName = `${diseaseLabel}: ${p.firstName} ${p.lastName} (${p.bloodGroup})`;
        } else if (givenLoanCompany) {
          hospitalName = `${givenLoanCompany} — Given Loan`;
        }

        return {
          _id: u._id.toString(),
          unitId: u.unitId,
          bagNo: displayBagNo,
          segmentNo,
          storageLocation: u.storageLocation || undefined,
          clinicalIndicationPatient: u.clinicalIndicationPatient || undefined,
          typeOfBag,
          issuedAt: u.issuedAt ? u.issuedAt.toISOString() : undefined,
          donationId: u.donationId || undefined,
          isLoan: !!loanedFrom,
          ttiRetest: ttiRetestMap.has(u.donationId),
          ttiLastEditedAt: ttiRetestMap.get(u.donationId) || undefined,
          bag: {
            bagNo: displayBagNo,
            bloodGroup: u.aboGroup,
            rh: u.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
            segmentNo,
            batchNo: donObj?.batchNo || undefined,
            // Loaned-in bags have no real Donation record to join (see
            // above) — their own collectedAt (set directly on the
            // BloodUnit at intake) is the real collection date instead.
            donationDate: donObj?.collectedAt
              ? donObj.collectedAt.toISOString()
              : loanedFrom && u.collectedAt
                ? new Date(u.collectedAt).toISOString()
                : undefined,
            donorName: loanedFrom ? `On loan — ${loanedFrom.bloodBankName || 'Unknown'}` : (donObj?.donorName || 'Unknown'),
            donorId: donObj?.donorId || undefined,
            donorPhone: donObj?.donorPhone || undefined,
            donorEmail: donObj?.donorEmail || undefined,
            donationType: loanedFrom ? 'LOAN' : (donObj?.donationType || 'VOLUNTARY'),
          },
          component: {
            componentType: legacyType,
            volumeMl: u.volumeMl,
            expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
            componentId: u.unitId,
          },
          status: legacyStatus,
          reservedUntil: u.reservedUntil ? u.reservedUntil.toISOString() : undefined,
          hospital: { name: hospitalName },
          reservedPatientName: patientName,
          reservedPatientAge: patientAge,
          reservedPatientSex: patientSex,
          requisition: requisitionObj,
          source: loanedFrom ? 'LOAN' : 'OWN',
          loanTransfer: loanedFrom
            ? { transferId: loanedFrom.transferId, bloodBankName: loanedFrom.bloodBankName }
            : undefined,
          _sortDate: u.createdAt,
        };
      });

      // Sort purely by the trailing digit run (e.g. `SBCK26-D-0002` -> 2),
      // not a left-to-right natural compare — the D/T segment-type letter
      // must never affect ordering (a plain numeric localeCompare would
      // hit that letter before the digits and wrongly group all D's ahead
      // of all T's regardless of sequence number).
      const lastDigitRun = (s: string): number | null => {
        const m = s.match(/(\d+)(?!.*\d)/);
        return m ? Number(m[1]) : null;
      };
      const bagNoCompare = (a: any, b: any) => {
        const aStr = String(a.bag?.bagNo ?? a.bagNo ?? '');
        const bStr = String(b.bag?.bagNo ?? b.bagNo ?? '');
        const aNum = lastDigitRun(aStr);
        const bNum = lastDigitRun(bStr);
        const cmp =
          aNum !== null && bNum !== null && aNum !== bNum
            ? aNum - bNum
            : aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: 'base' });
        return cmp * (sortDir === 1 ? 1 : -1);
      };

      let combined: any[];
      const combinedTotal = total;
      if (bagNoSort) {
        combined = [...data].sort(bagNoCompare);
      } else {
        combined = data;
      }

      const pageData = bagNoSort ? combined.slice(skipNum, skipNum + limitNum) : combined;
      pageData.forEach((row: any) => {
        delete row._sortDate;
      });

      return {
        data: pageData,
        total: combinedTotal,
        totalPages: Math.ceil(combinedTotal / limitNum),
        page: pageNum,
        limit: limitNum,
      };
    },

    async unreserve(inventoryIds, actorId, reason) {
      const affected: Array<{ unitId: string; componentType: string; bagNo: string }> = [];
      for (const id of inventoryIds) {
        let unit = await BloodUnitModel.findById(id);
        if (!unit) unit = await BloodUnitModel.findOne({ unitId: id });
        if (!unit) continue;

        const requisitionId = unit.reservedFor;

        await deps.units.applyEvent({
          unitId: unit.unitId,
          event: 'UNRESERVE',
          actorId,
          reason,
          set: {
            reservedFor: null,
            reservedUntil: null,
            reservedAt: null,
            unreservedBy: 'MANUAL',
            unreservedReason: reason,
          } as any,
        });

        // Keep the owning requisition's matched-unit entry in sync so
        // /requisition/list shows "Unreserved — Manually unreserved" too.
        // Also clear any recorded crossmatch back to PENDING (unless the
        // component never needed one) — it was only ever valid for this
        // specific reservation; a re-reservation later must not silently
        // inherit a compatible result that was never re-verified for it.
        if (requisitionId) {
          await RequisitionModel.findOneAndUpdate(
            { _id: requisitionId, 'matchedUnits.unitId': unit.unitId },
            [
              {
                $set: {
                  matchedUnits: {
                    $map: {
                      input: '$matchedUnits',
                      as: 'mu',
                      in: {
                        $cond: [
                          { $eq: ['$$mu.unitId', unit.unitId] },
                          {
                            $mergeObjects: [
                              '$$mu',
                              {
                                reserved: false,
                                unreservedBy: 'MANUAL',
                                unreservedReason: reason,
                                crossmatchStatus: {
                                  $cond: [
                                    { $eq: ['$$mu.crossmatchStatus', 'NOT_REQUIRED'] },
                                    'NOT_REQUIRED',
                                    'PENDING',
                                  ],
                                },
                                compatibilityResult: null,
                                crossmatchDoneAt: null,
                                crossmatchSeenAt: null,
                                cardNumber: null,
                              },
                            ],
                          },
                          '$$mu',
                        ],
                      },
                    },
                  },
                },
              },
            ],
          ).catch(() => undefined);
        }

        const donation = await findOneAcrossDonations<{ bagNo?: string }>(
          { donationId: unit.donationId },
        );
        affected.push({
          unitId: unit.unitId,
          componentType: unit.componentType,
          bagNo: donation?.bagNo || unit.donationId,
        });
      }
      return affected;
    },

    async sendToStorage({ location, otherLocationName, bags, sentDate, actorId }) {
      let finalLocation: string | null = null;
      if (!location) throw new ValidationError('Location is required');
      finalLocation = location === 'Others' ? (otherLocationName ?? null) : location;
      if (!finalLocation) throw new ValidationError('Location name is required');

      const unitIds: string[] = [];
      for (const group of bags) {
        if (Array.isArray(group.bagIds)) unitIds.push(...group.bagIds);
      }
      if (unitIds.length === 0) throw new ValidationError('No blood bags selected');

      const actorObjId = new Types.ObjectId(actorId);
      const skipped: string[] = [];

      for (const id of unitIds) {
        let lookup = await BloodUnitModel.findById(id).select('_id').lean();
        if (!lookup) lookup = await BloodUnitModel.findOne({ unitId: id }).select('_id').lean();
        if (!lookup) continue;

        const claimed = await BloodUnitModel.findOneAndUpdate(
          { _id: lookup._id, status: 'RELEASED' },
          {
            status: 'ISSUED',
            issuedAt: sentDate ? new Date(sentDate) : new Date(),
            updatedBy: actorObjId,
          },
          { new: true },
        );
        if (!claimed) {
          skipped.push(id);
          continue;
        }
        const unit = claimed;

        unit.storageLocation = finalLocation as any;
        unit.statusHistory.push({
          from: 'RELEASED',
          to: 'ISSUED',
          event: 'SEND_TO_STORAGE',
          actor: actorObjId,
          at: new Date(),
          reason: `Sent to storage at ${finalLocation}`,
        } as any);

        await unit.save();
      }

      await invalidate('inventory:*');

      const baseMessage = 'Blood units successfully sent to storage.';
      const message =
        skipped.length > 0
          ? `${baseMessage} ${skipped.length} bag(s) were skipped because they were no longer in stock.`
          : baseMessage;

      return { skipped, message };
    },

    async updateStorage({ id, location, otherLocationName, actorId }) {
      let unit = await BloodUnitModel.findById(id);
      if (!unit) unit = await BloodUnitModel.findOne({ unitId: id });
      if (!unit || unit.status !== 'ISSUED' || !unit.storageLocation) {
        throw new NotFoundError('Storage bag', id);
      }

      const finalLocation = location === 'Others' ? otherLocationName : location;
      if (!finalLocation) throw new ValidationError('Location name is required');

      const actorObjId = new Types.ObjectId(actorId);
      const fromLocation = unit.storageLocation;
      unit.storageLocation = finalLocation as any;
      unit.updatedBy = actorObjId as any;
      unit.statusHistory.push({
        from: 'ISSUED',
        to: 'ISSUED',
        event: 'STORAGE_LOCATION_UPDATED',
        actor: actorObjId,
        at: new Date(),
        reason: `Storage location changed from ${fromLocation} to ${finalLocation}`,
      } as any);
      await unit.save();
      await invalidate('inventory:*');

      const donation = await findOneAcrossDonations<{ bagNo?: string }>({
        donationId: unit.donationId,
      });
      return {
        id: unit._id.toString(),
        bagNo: donation?.bagNo || unit.donationId,
        storageLocation: finalLocation,
      };
    },

    async returnFromStorage(id, actorId) {
      let unit = await BloodUnitModel.findById(id);
      if (!unit) unit = await BloodUnitModel.findOne({ unitId: id });
      if (!unit || unit.status !== 'ISSUED' || !unit.storageLocation) {
        throw new NotFoundError('Storage bag', id);
      }

      const actorObjId = new Types.ObjectId(actorId);
      const fromLocation = unit.storageLocation;
      unit.status = 'RELEASED' as any;
      (unit as any).storageLocation = null;
      (unit as any).issuedAt = undefined;
      unit.updatedBy = actorObjId as any;
      unit.statusHistory.push({
        from: 'ISSUED',
        to: 'RELEASED',
        event: 'STORAGE_RETURN',
        actor: actorObjId,
        at: new Date(),
        reason: `Removed from storage at ${fromLocation} — bag returned to stock`,
      } as any);
      await unit.save();
      await invalidate('inventory:*');

      const donation = await findOneAcrossDonations<{ bagNo?: string; segmentNo?: string }>({
        donationId: unit.donationId,
      });
      return {
        id: unit._id.toString(),
        bagNo: donation?.bagNo || unit.donationId,
        storageLocation: fromLocation,
        componentType: unit.componentType,
        aboGroup: unit.aboGroup,
        rhFactor: unit.rhFactor,
        segmentNo: donation?.segmentNo || undefined,
      };
    },
  };
}
