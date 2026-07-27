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
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
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
}

export interface SendToStorageInput {
  location?: string;
  otherLocationName?: string;
  bags: Array<{ bagIds: string[] }>;
  dispatchType?: string;
  clinicalIndicationPatient?: {
    firstName: string;
    lastName: string;
    disease: string;
    otherDiseaseName?: string;
    [key: string]: unknown;
  } | null;
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
  listStock(filters: StockListFilters): Promise<{ data: any[]; total: number; totalPages: number; page: number; limit: number }>;
  unreserve(inventoryIds: string[], actorId: string): Promise<void>;
  sendToStorage(input: SendToStorageInput): Promise<{ skipped: string[]; message: string }>;
  updateStorage(input: UpdateStorageInput): Promise<StorageUnitSummary>;
  returnFromStorage(id: string, actorId: string): Promise<StorageUnitSummary>;
}

export function createInventoryLegacyViewRepo(deps: { units: UnitRepo }): InventoryLegacyViewRepo {
  return {
    async listStock(filters) {
      const {
        page, limit, status, componentType, siteId, search, sortBy, order,
        storageLocation, dispatchType, bloodGroup, rh, expiryFrom, expiryTo, source,
      } = filters;

      const wantsOwn = status !== 'in-stock' || source !== 'loan';
      const wantsLoan = status === 'in-stock' && (source === 'all' || source === 'loan');

      const unitFilter: any = {
        $and: [{ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }],
      };

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

      if (siteId) unitFilter.campId = new Types.ObjectId(siteId);
      if (bloodGroup) unitFilter.aboGroup = bloodGroup;
      if (rh) unitFilter.rhFactor = rh === 'Positive' || rh === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
      if (expiryFrom || expiryTo) {
        unitFilter.expiresAt = {};
        if (expiryFrom) unitFilter.expiresAt.$gte = new Date(expiryFrom);
        if (expiryTo) unitFilter.expiresAt.$lte = new Date(expiryTo);
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const matchingDonations = await DonationModel.find({
          $and: [
            { $or: [{ donationId: searchRegex }, { bagNo: searchRegex }] },
            { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
          ],
        })
          .select('donationId')
          .lean();
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

      const needsMerge = wantsOwn && wantsLoan;

      let total = 0;
      let units: any[] = [];
      if (wantsOwn) {
        total = await BloodUnitModel.countDocuments(unitFilter);
        units = await BloodUnitModel.find(unitFilter)
          .populate({
            path: 'reservedFor',
            populate: [
              { path: 'hospitalId', select: 'name' },
              { path: 'patientId', select: 'name dob sex' },
            ],
          })
          .sort({ [sortField]: sortDir })
          .skip(needsMerge ? 0 : skipNum)
          .limit(needsMerge ? 5000 : limitNum)
          .lean();
      }

      const donationIds = units.map((u) => u.donationId).filter(Boolean);
      const donations = await DonationModel.find({
        donationId: { $in: donationIds },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      })
        .select('donationId bagNo segmentNo lotNo typeOfBag collectedAt donor donationType')
        .lean();

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
            requisitionId: reqDoc.requisitionId,
            doctorName: reqDoc.doctorName || reqDoc.clinicianName,
            requiredAt: reqDoc.requiredAt ? reqDoc.requiredAt.toISOString() : undefined,
            medicalOfficerSignature: reqDoc.medicalOfficerSignature,
            hospitalSeal: reqDoc.hospitalSeal,
            patient: reqDoc.patient,
          };
        }

        const donObj = donationMap.get(u.donationId);
        const displayBagNo = donObj?.bagNo || u.donationId;
        const segmentNo = donObj?.segmentNo || u.unitDin || u.unitId || '—';
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
          bagNo: displayBagNo,
          segmentNo,
          storageLocation: u.storageLocation || undefined,
          clinicalIndicationPatient: u.clinicalIndicationPatient || undefined,
          typeOfBag,
          issuedAt: u.issuedAt ? u.issuedAt.toISOString() : undefined,
          bag: {
            bagNo: displayBagNo,
            bloodGroup: u.aboGroup,
            rh: u.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
            segmentNo,
            batchNo: donObj?.batchNo || undefined,
            donationDate: donObj?.collectedAt ? donObj.collectedAt.toISOString() : undefined,
            donorName: donObj?.donorName || 'Unknown',
            donorId: donObj?.donorId || undefined,
            donorPhone: donObj?.donorPhone || undefined,
            donorEmail: donObj?.donorEmail || undefined,
            donationType: donObj?.donationType || 'VOLUNTARY',
          },
          component: {
            componentType: legacyType,
            volumeMl: u.volumeMl,
            expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
          },
          status: legacyStatus,
          reservedUntil: u.reservedUntil ? u.reservedUntil.toISOString() : undefined,
          hospital: { name: hospitalName },
          reservedPatientName: patientName,
          reservedPatientAge: patientAge,
          reservedPatientSex: patientSex,
          requisition: requisitionObj,
          source: 'OWN',
          _sortDate: u.createdAt,
        };
      });

      let loanRows: any[] = [];
      if (wantsLoan) {
        const loanTransfers = await BulkTransferModel.find({ transferType: 'TAKE_LOAN', deletedAt: null }).lean();
        const searchRegex = search ? new RegExp(search, 'i') : null;

        loanTransfers.forEach((t: any) => {
          (t.items || []).forEach((it: any, idx: number) => {
            if (componentType && it.componentType !== componentType) return;
            if (bloodGroup && it.bloodGroup?.replace(/[+-]/, '') !== bloodGroup) return;
            if (rh) {
              const wantsNegative = rh === 'Negative' || rh === 'NEGATIVE';
              const isNegative = it.bloodGroup?.endsWith('-');
              if (wantsNegative !== Boolean(isNegative)) return;
            }
            if (expiryFrom && it.expiresAt && new Date(it.expiresAt) < new Date(expiryFrom)) return;
            if (expiryTo && it.expiresAt && new Date(it.expiresAt) > new Date(expiryTo)) return;
            if (searchRegex && !searchRegex.test(it.bagNo || '') && !searchRegex.test(t.transferId || '')) return;

            const rhLabel = it.bloodGroup?.endsWith('-') ? 'Negative' : 'Positive';
            const bloodGroupLetter = (it.bloodGroup || '').replace(/[+-]/, '');

            loanRows.push({
              _id: `LOAN-${t._id.toString()}-${idx}`,
              bagNo: it.bagNo,
              segmentNo: it.segmentNo || '—',
              typeOfBag: 'SB',
              bag: {
                bagNo: it.bagNo,
                bloodGroup: bloodGroupLetter,
                rh: rhLabel,
                segmentNo: it.segmentNo || '—',
                donationDate: it.collectedAt ? new Date(it.collectedAt).toISOString() : undefined,
                donorName: `Loan: ${t.bloodBankName}`,
                donationType: 'LOAN',
              },
              component: {
                componentType: it.componentType,
                volumeMl: it.volumeMl,
                expiryDate: it.expiresAt ? new Date(it.expiresAt).toISOString() : '',
              },
              status: 'in-stock',
              hospital: { name: `Loan From: ${t.bloodBankName}` },
              source: 'LOAN',
              loanTransfer: {
                transferId: t.transferId,
                bloodBankName: t.bloodBankName,
                bloodBankAddress: t.bloodBankAddress,
                transferDate: t.transferDate ? new Date(t.transferDate).toISOString() : undefined,
              },
              _sortDate: t.createdAt,
            });
          });
        });
      }

      let combined: any[];
      let combinedTotal: number;
      if (source === 'loan') {
        combined = loanRows;
        combinedTotal = loanRows.length;
      } else if (needsMerge) {
        combined = [...data, ...loanRows].sort(
          (a, b) => new Date(b._sortDate || 0).getTime() - new Date(a._sortDate || 0).getTime(),
        );
        combinedTotal = combined.length;
      } else {
        combined = data;
        combinedTotal = total;
      }

      const pageData = source === 'loan' || needsMerge ? combined.slice(skipNum, skipNum + limitNum) : combined;
      pageData.forEach((row: any) => {
        delete row._sortDate;
      });

      return { data: pageData, total: combinedTotal, totalPages: Math.ceil(combinedTotal / limitNum), page: pageNum, limit: limitNum };
    },

    async unreserve(inventoryIds, actorId) {
      for (const id of inventoryIds) {
        let unit = await BloodUnitModel.findById(id);
        if (!unit) unit = await BloodUnitModel.findOne({ unitId: id });
        if (!unit) continue;

        await deps.units.applyEvent({
          unitId: unit.unitId,
          event: 'UNRESERVE',
          actorId,
          reason: 'Manual unreserve from inventory screen',
          set: { reservedFor: null, reservedUntil: null, reservedAt: null } as any,
        });
      }
    },

    async sendToStorage({ location, otherLocationName, bags, dispatchType, clinicalIndicationPatient, sentDate, actorId }) {
      const isClinicalIndication = dispatchType === 'CLINICAL_INDICATION';

      let finalLocation: string | null = null;
      if (!isClinicalIndication) {
        if (!location) throw new ValidationError('Location is required');
        finalLocation = location === 'Others' ? (otherLocationName ?? null) : location;
        if (!finalLocation) throw new ValidationError('Location name is required');
      } else {
        if (
          !clinicalIndicationPatient ||
          !clinicalIndicationPatient.firstName ||
          !clinicalIndicationPatient.lastName ||
          !clinicalIndicationPatient.disease
        ) {
          throw new ValidationError('Patient details and disease are required');
        }
        if (
          clinicalIndicationPatient.disease === 'OTHER' &&
          !String(clinicalIndicationPatient.otherDiseaseName || '').trim()
        ) {
          throw new ValidationError('Please specify the disease name');
        }
      }

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
          { status: 'ISSUED', issuedAt: sentDate ? new Date(sentDate) : new Date(), updatedBy: actorObjId },
          { new: true },
        );
        if (!claimed) {
          skipped.push(id);
          continue;
        }
        const unit = claimed;

        if (isClinicalIndication && clinicalIndicationPatient) {
          const diseaseLabel =
            clinicalIndicationPatient.disease === 'THALASSEMIA'
              ? 'Thalassemia'
              : clinicalIndicationPatient.disease === 'SICKLE_CELL_ANAEMIA'
                ? 'Sickle Cell Anaemia'
                : clinicalIndicationPatient.otherDiseaseName || 'Other';
          (unit as any).storageLocation = null;
          (unit as any).clinicalIndicationPatient = clinicalIndicationPatient;
          unit.statusHistory.push({
            from: 'RELEASED',
            to: 'ISSUED',
            event: 'ISSUE',
            actor: actorObjId,
            at: new Date(),
            reason: `Issued to ${diseaseLabel} Patient: ${clinicalIndicationPatient.firstName} ${clinicalIndicationPatient.lastName}`,
          } as any);
        } else {
          unit.storageLocation = finalLocation as any;
          (unit as any).clinicalIndicationPatient = null;
          unit.statusHistory.push({
            from: 'RELEASED',
            to: 'ISSUED',
            event: 'SEND_TO_STORAGE',
            actor: actorObjId,
            at: new Date(),
            reason: `Sent to storage at ${finalLocation}`,
          } as any);
        }

        await unit.save();
      }

      await invalidate('inventory:*');

      const baseMessage = isClinicalIndication
        ? 'Blood units successfully issued for the clinical indication.'
        : 'Blood units successfully sent to storage.';
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

      const donation = await DonationModel.findOne({ donationId: unit.donationId }).select('bagNo').lean();
      return { id: unit._id.toString(), bagNo: donation?.bagNo || unit.donationId, storageLocation: finalLocation };
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

      const donation = await DonationModel.findOne({ donationId: unit.donationId }).select('bagNo segmentNo').lean();
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
