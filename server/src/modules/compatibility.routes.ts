import { Router } from 'express';
import mongoose, { Types } from 'mongoose';
import { authenticate } from '@/shared/middlewares/authenticate';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { createTtiRepo } from '@/modules/tti/tti.repository';
import { createUnitRepo } from '@/modules/unit/unit.repository';
import { createDeferralRepo } from '@/modules/deferral/deferral.repository';
import { createDonationRepo } from '@/modules/donation/donation.repository';
import { createTtiService } from '@/modules/tti/tti.service';
import { createBagStockRepo } from '@/modules/bag-stock/bag-stock.repository';
import { invalidate } from '@/core/cache';
import { BagInspectionModel } from '@/modules/bag-inspection/bag-inspection.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { TransfusionModel } from '@/modules/transfusion/transfusion.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { CampModel } from '@/modules/camp/camp.model';
import { UserModel } from '@/modules/user/user.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';

const router = Router();

const ttiService = createTtiService({
  tti: createTtiRepo(),
  units: createUnitRepo(),
  deferrals: createDeferralRepo(),
  donations: createDonationRepo(),
  bagStock: createBagStockRepo(),
});

// 1. GET /inventory
router.get('/inventory', authenticate, async (req, res, next) => {
  try {
    const { page, limit, status, componentType, siteId, search, sortBy, order, storageLocation, dispatchType, bloodGroup, rh, expiryFrom, expiryTo, source } = req.query as any;

    // Bags taken in on loan from another blood bank live only in
    // BulkTransfer (see bulk-transfer module) — they never had a Donation/
    // BloodUnit record created for them at this bank, so they have no real
    // unitId. They must NOT leak into pickers that need a real BloodUnit to
    // act on (Give Loan bag picker, Send to Storage, Issue, Reserve, ...) —
    // those callers never pass `source`, so the default here is 'own' only.
    // Only the Stock page explicitly opts into source=all/loan to display
    // them in the general listing.
    const wantsOwn = status !== 'in-stock' || source !== 'loan';
    const wantsLoan = status === 'in-stock' && (source === 'all' || source === 'loan');

    const unitFilter: any = {
      $and: [
        { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }
      ]
    };

    if (status) {
      if (status === 'in-stock') unitFilter.status = 'RELEASED';
      else if (status === 'reserved') {
        unitFilter.status = { $in: ['RESERVED', 'CROSSMATCHED'] };
      }
      else if (status === 'issued') unitFilter.status = 'ISSUED';
    } else {
      unitFilter.status = { $in: ['RELEASED', 'RESERVED', 'CROSSMATCHED', 'ISSUED'] };
    }

    if (componentType) {
      if (componentType === 'RBC') unitFilter.componentType = 'PRBC';
      else if (componentType === 'Platelet') unitFilter.componentType = 'PLATELET_CONCENTRATE';
      else if (componentType === 'Cryo') unitFilter.componentType = 'CRYOPRECIPITATE';
      else unitFilter.componentType = componentType;
    }

    if (siteId) {
      unitFilter.campId = new Types.ObjectId(siteId);
    }

    if (bloodGroup) {
      unitFilter.aboGroup = bloodGroup;
    }
    if (rh) {
      unitFilter.rhFactor = rh === 'Positive' || rh === 'POSITIVE' ? 'POSITIVE' : 'NEGATIVE';
    }
    if (expiryFrom || expiryTo) {
      unitFilter.expiresAt = {};
      if (expiryFrom) unitFilter.expiresAt.$gte = new Date(expiryFrom);
      if (expiryTo) unitFilter.expiresAt.$lte = new Date(expiryTo);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingDonations = await DonationModel.find({
        $and: [
          {
            $or: [
              { donationId: searchRegex },
              { bagNo: searchRegex }
            ]
          },
          {
            $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
          }
        ]
      }).select('donationId').lean();

      const matchedDonationIds = matchingDonations.map(d => d.donationId);

      unitFilter.$and.push({
        $or: [
          { donationId: { $in: matchedDonationIds } },
          { donationId: searchRegex },
          { unitId: searchRegex },
          { aboGroup: searchRegex }
        ]
      });
    }
    if (status === 'issued') {
      if (dispatchType === 'CLINICAL_INDICATION') {
        unitFilter['clinicalIndicationPatient'] = { $exists: true, $ne: null };
      } else if (storageLocation) {
        unitFilter['storageLocation'] = new RegExp(storageLocation, 'i');
      } else {
        unitFilter['storageLocation'] = { $eq: null };
      }
    } else {
      if (storageLocation) {
        unitFilter['storageLocation'] = new RegExp(storageLocation, 'i');
      }
      if (dispatchType === 'CLINICAL_INDICATION') {
        unitFilter['clinicalIndicationPatient'] = { $exists: true, $ne: null };
      }
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';

    // When loan rows need to be merged in, fetch the full (bounded) own-unit
    // set instead of a DB-level page so the two sources can be combined and
    // re-paginated together in memory.
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
            { path: 'patientId', select: 'name dob sex' }
          ]
        })
        .sort({ [sortField]: sortDir })
        .skip(needsMerge ? 0 : skipNum)
        .limit(needsMerge ? 5000 : limitNum)
        .lean();
    }

    const donationIds = units.map(u => u.donationId).filter(Boolean);
    const donations = await DonationModel.find({
      donationId: { $in: donationIds },
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
    }).select('donationId bagNo segmentNo lotNo typeOfBag collectedAt donor donationType').lean();

    const donorIds = donations.map((d: any) => d.donor).filter(Boolean);
    const donors = await DonorModel.find({ _id: { $in: donorIds } }).select('_id donorId name phone email bloodGroup rh').lean() as any[];
    const donorInfoMap = new Map<string, { name: string; donorId?: string; phone?: string; email?: string; bloodGroup?: string; rh?: string }>();
    donors.forEach(d => {
      const fullName = d.name ? [d.name.firstName, d.name.middleName, d.name.lastName].filter(Boolean).join(' ') : 'Unknown';
      donorInfoMap.set(d._id.toString(), {
        name: fullName,
        donorId: d.donorId,
        phone: d.phone,
        email: d.email,
        bloodGroup: d.bloodGroup,
        rh: d.rh === 'NEGATIVE' ? 'Negative' : 'Positive',
      });
    });

    const donationMap = new Map<string, { bagNo: string; segmentNo?: string | null; batchNo?: string | null; typeOfBag?: string; collectedAt?: Date; donorName?: string; donorId?: string; donorPhone?: string; donorEmail?: string; donationType?: string }>();
    donations.forEach(d => {
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
          donationType: d.donationType
        });
      }
    });

    const data = units.map(u => {
      let legacyStatus = 'in-stock';
      if (u.status === 'RELEASED') legacyStatus = 'in-stock';
      else if (u.status === 'RESERVED') legacyStatus = 'reserved';
      else if (u.status === 'ISSUED') legacyStatus = 'issued';

      let legacyType: string = u.componentType;
      if (u.componentType === 'PRBC') legacyType = 'RBC';
      else if (u.componentType === 'PLATELET_CONCENTRATE') legacyType = 'Platelet';
      else if (u.componentType === 'CRYOPRECIPITATE') legacyType = 'Cryo';

      let hospitalName = 'Ã¢â‚¬â€';
      let patientName = 'Ã¢â‚¬â€';
      let patientAge = '';
      let patientSex = 'Ã¢â‚¬â€';
      let requisitionObj: any = null;

      if (u.reservedFor && typeof u.reservedFor === 'object') {
        const reqDoc = u.reservedFor as any;
        if (reqDoc.hospitalId && typeof reqDoc.hospitalId === 'object') {
          hospitalName = reqDoc.hospitalId.name || 'Ã¢â‚¬â€';
        }
        if (reqDoc.patientId && typeof reqDoc.patientId === 'object') {
          const patientDoc = reqDoc.patientId;
          patientName = patientDoc.name || 'Ã¢â‚¬â€';
          patientSex = patientDoc.sex || 'Ã¢â‚¬â€';
          if (patientDoc.dob) {
            const birthDate = new Date(patientDoc.dob);
            const today = new Date();
            let calculatedAge = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              calculatedAge--;
            }
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
      const segmentNo = donObj?.segmentNo || u.unitDin || u.unitId || 'Ã¢â‚¬â€';
      const typeOfBag = donObj?.typeOfBag || 'SB';

      if (u.storageLocation) {
        hospitalName = u.storageLocation;
      } else if (u.clinicalIndicationPatient) {
        const p = u.clinicalIndicationPatient;
        const diseaseLabel = p.disease === 'THALASSEMIA' ? 'Thalassemia'
          : p.disease === 'SICKLE_CELL_ANAEMIA' ? 'Sickle Cell Anaemia'
          : (p.otherDiseaseName || 'Other');
        hospitalName = `${diseaseLabel}: ${p.firstName} ${p.lastName} (${p.bloodGroup})`;
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
        hospital: {
          name: hospitalName,
        },
        reservedPatientName: patientName,
        reservedPatientAge: patientAge,
        reservedPatientSex: patientSex,
        requisition: requisitionObj,
        source: 'OWN',
        _sortDate: u.createdAt,
      };
    });

    // Bags taken in on loan — flattened out of BulkTransfer items, never a
    // real Donation/BloodUnit, but shown as "in-stock" like any other bag.
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
      combined = [...data, ...loanRows].sort((a, b) => new Date(b._sortDate || 0).getTime() - new Date(a._sortDate || 0).getTime());
      combinedTotal = combined.length;
    } else {
      combined = data;
      combinedTotal = total;
    }

    const pageData = (source === 'loan' || needsMerge)
      ? combined.slice(skipNum, skipNum + limitNum)
      : combined;
    pageData.forEach((row: any) => { delete row._sortDate; });

    res.json({
      success: true,
      data: pageData,
      pagination: {
        total: combinedTotal,
        totalPages: Math.ceil(combinedTotal / limitNum),
        page: pageNum,
        limit: limitNum,
      }
    });
  } catch (e) {
    next(e);
  }
});



// POST /inventory/unreserve
router.post('/inventory/unreserve', authenticate, async (req, res, next) => {
  try {
    const { inventoryIds, userId } = req.body;
    const actorId = (req.user as any)?.id || userId;

    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'inventoryIds must be a non-empty array' });
    }

    const unitRepo = createUnitRepo();

    for (const id of inventoryIds) {
      let unit = await BloodUnitModel.findById(id);
      if (!unit) {
        unit = await BloodUnitModel.findOne({ unitId: id });
      }

      if (unit) {
        await unitRepo.applyEvent({
          unitId: unit.unitId,
          event: 'UNRESERVE',
          actorId,
          reason: 'Manual unreserve from inventory screen',
          set: {
            reservedFor: null,
            reservedUntil: null,
            reservedAt: null,
          } as any,
        });
      }
    }

    res.json({ success: true, message: 'Blood units successfully unreserved.' });
  } catch (e) {
    next(e);
  }
});

// POST /inventory/issue
router.post('/inventory/issue', authenticate, async (req, res, next) => {
  try {
    const { inventoryIds, userId } = req.body;
    const actorId = (req.user as any)?.id || userId;

    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({ success: false, message: 'inventoryIds must be a non-empty array' });
    }

    const actorObjId = new Types.ObjectId(actorId);

    for (const id of inventoryIds) {
      let unit = await BloodUnitModel.findById(id);
      if (!unit) {
        unit = await BloodUnitModel.findOne({ unitId: id });
      }
      if (!unit) continue;

      const oldStatus = unit.status;
      unit.status = 'ISSUED';
      unit.issuedAt = new Date();
      unit.updatedBy = actorObjId;

      let requisitionId = unit.reservedFor;
      let patientId: any = null;

      if (requisitionId) {
        const reqDoc = await RequisitionModel.findById(requisitionId);
        if (reqDoc) {
          patientId = reqDoc.patientId;
          if (reqDoc.status !== 'COMPLETED') {
            reqDoc.status = 'ISSUED';
          }
          await reqDoc.save();
        }
      }

      // Create an Issue record
      const issueId = `IS-${new Date().getUTCFullYear()}${String(new Date().getUTCMonth() + 1).padStart(2, '0')}${String(new Date().getUTCDate()).padStart(2, '0')}-${new Types.ObjectId().toHexString().slice(-6).toUpperCase()}`;

      const newIssue = await IssueModel.create({
        issueId,
        requisitionId: requisitionId || new Types.ObjectId(),
        unitId: unit.unitId,
        patientId: patientId || new Types.ObjectId(),
        issuedBy: actorObjId,
        createdBy: actorObjId,
        updatedBy: actorObjId,
      });

      unit.issuedTo = newIssue._id;

      unit.statusHistory.push({
        from: oldStatus,
        to: 'ISSUED',
        event: 'ISSUE',
        actor: actorObjId,
        at: new Date(),
        reason: 'Issued from inventory screen',
      } as any);

      await unit.save();
    }

    await invalidate('inventory:*');

    res.json({ success: true, message: 'Blood units successfully issued.' });
  } catch (e) {
    next(e);
  }
});

// POST /inventory/send-to-storage
router.post('/inventory/send-to-storage', authenticate, async (req, res, next) => {
  try {
    const { location, otherLocationName, bags, userId, dispatchType, clinicalIndicationPatient, sentDate } = req.body;
    const actorId = (req.user as any)?.id || userId;
    const isClinicalIndication = dispatchType === 'CLINICAL_INDICATION';

    let finalLocation = null;
    if (!isClinicalIndication) {
      if (!location) {
        return res.status(400).json({ success: false, message: 'Location is required' });
      }
      finalLocation = location === 'Others' ? otherLocationName : location;
      if (!finalLocation) {
        return res.status(400).json({ success: false, message: 'Location name is required' });
      }
    } else {
      if (!clinicalIndicationPatient || !clinicalIndicationPatient.firstName || !clinicalIndicationPatient.lastName || !clinicalIndicationPatient.disease) {
        return res.status(400).json({ success: false, message: 'Patient details and disease are required' });
      }
      if (clinicalIndicationPatient.disease === 'OTHER' && !clinicalIndicationPatient.otherDiseaseName?.trim()) {
        return res.status(400).json({ success: false, message: 'Please specify the disease name' });
      }
    }

    if (!Array.isArray(bags) || bags.length === 0) {
      return res.status(400).json({ success: false, message: 'bags must be a non-empty array' });
    }

    const actorObjId = new Types.ObjectId(actorId);

    // Extract all unit IDs/bag IDs
    const unitIds: string[] = [];
    for (const group of bags) {
      if (Array.isArray(group.bagIds)) {
        unitIds.push(...group.bagIds);
      }
    }

    if (unitIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No blood bags selected' });
    }

    for (const id of unitIds) {
      let unit = await BloodUnitModel.findById(id);
      if (!unit) {
        unit = await BloodUnitModel.findOne({ unitId: id });
      }
      if (!unit) continue;

      const oldStatus = unit.status;
      unit.status = 'ISSUED';
      unit.issuedAt = sentDate ? new Date(sentDate) : new Date();
      unit.updatedBy = actorObjId;

      if (isClinicalIndication) {
        const diseaseLabel = clinicalIndicationPatient.disease === 'THALASSEMIA' ? 'Thalassemia'
          : clinicalIndicationPatient.disease === 'SICKLE_CELL_ANAEMIA' ? 'Sickle Cell Anaemia'
          : (clinicalIndicationPatient.otherDiseaseName || 'Other');
        (unit as any).storageLocation = null;
        (unit as any).clinicalIndicationPatient = clinicalIndicationPatient;
        unit.statusHistory.push({
          from: oldStatus,
          to: 'ISSUED',
          event: 'ISSUE',
          actor: actorObjId,
          at: new Date(),
          reason: `Issued to ${diseaseLabel} Patient: ${clinicalIndicationPatient.firstName} ${clinicalIndicationPatient.lastName}`,
        } as any);
      } else {
        unit.storageLocation = finalLocation;
        (unit as any).clinicalIndicationPatient = null;
        unit.statusHistory.push({
          from: oldStatus,
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

    res.json({ success: true, message: isClinicalIndication ? 'Blood units successfully issued for the clinical indication.' : 'Blood units successfully sent to storage.' });
  } catch (e) {
    next(e);
  }
});

// 2. GET /discard/get-list
router.get('/discard/get-list', authenticate, async (req, res, next) => {
  try {
    const { page, limit, search, itemType, fromDate, toDate, sortBy, order } = req.query as any;

    const unitFilter: any = {
      status: 'DISCARDED',
      $and: [
        { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }
      ]
    };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingDonations = await DonationModel.find({
        $and: [
          {
            $or: [
              { donationId: searchRegex },
              { bagNo: searchRegex }
            ]
          },
          {
            $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
          }
        ]
      }).select('donationId').lean();

      const matchedDonationIds = matchingDonations.map(d => d.donationId);

      unitFilter.$and.push({
        $or: [
          { donationId: { $in: matchedDonationIds } },
          { donationId: searchRegex },
          { unitId: searchRegex }
        ]
      });
    }

    if (fromDate || toDate) {
      unitFilter.updatedAt = {};
      if (fromDate) unitFilter.updatedAt.$gte = new Date(fromDate);
      if (toDate) unitFilter.updatedAt.$lte = new Date(toDate);
    }


    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const sortDir = order === 'asc' ? 1 : -1;
    let sortField = sortBy || 'updatedAt';
    if (sortField === 'discardedAt') {
      sortField = 'updatedAt';
    }

    const total = await BloodUnitModel.countDocuments(unitFilter);
    const units = await BloodUnitModel.find(unitFilter)
      .sort({ [sortField]: sortDir })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const donationIds = units.map(u => u.donationId).filter(Boolean);
    const donations = await DonationModel.find({
      donationId: { $in: donationIds },
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
    }).populate('donor').populate('campId').lean();

    const ttis = await TtiResultModel.find({
      donationId: { $in: donationIds }
    }).lean();

    const donationMap = new Map<string, any>();
    donations.forEach(d => {
      if (d.donationId) {
        donationMap.set(d.donationId, d);
      }
    });

    const ttiMap = new Map<string, any>();
    ttis.forEach(t => {
      if (t.donationId) {
        ttiMap.set(t.donationId, t);
      }
    });

    const data = units.map(u => {
      let legacyType: string = u.componentType;
      if (u.componentType === 'PRBC') legacyType = 'RBC';
      else if (u.componentType === 'PLATELET_CONCENTRATE') legacyType = 'Platelet';
      else if (u.componentType === 'CRYOPRECIPITATE') legacyType = 'Cryo';

      const discardHistory = u.statusHistory?.find(h => h.to === 'DISCARDED');
      const donation = donationMap.get(u.donationId);
      const donor = donation?.donor as any;
      const tti = ttiMap.get(u.donationId);

      let testResultsStr = 'No tests performed';
      if (tti && tti.tests && tti.tests.length > 0) {
        testResultsStr = tti.tests.map((t: any) => {
          let tName = t.testName;
          if (tName === 'HBSAG') tName = 'HBsAg';
          else if (tName === 'SYPHILIS') tName = 'VDRL';
          else if (tName === 'MALARIA') tName = 'MP';

          let result = t.result;
          if (result === 'NEGATIVE') result = 'Negative';
          else if (result === 'REACTIVE') result = 'Reactive';
          else if (result === 'INDETERMINATE') result = 'Indeterminate';

          return `${tName}: ${result}`;
        }).join(', ');
      } else if (tti) {
        testResultsStr = `Release Decision: ${tti.releaseDecision}`;
      }

      return {
        id: u._id.toString(),
        bagNo: donation?.bagNo || u.donationId,
        componentId: u.unitId,
        componentType: legacyType,
        itemType: u.componentType === 'WHOLE_BLOOD' ? 'Bag' : 'Component',
        reason: u.discardReason || 'QC_FAIL',
        description: u.discardNotes || '',
        discardedAt: discardHistory ? discardHistory.at.toISOString() : u.updatedAt.toISOString(),

        // Modal additional fields
        itemId: u.unitId,
        siteId: donation?.campId ? (donation.campId as any).name : 'In-House',
        createdAt: u.createdAt.toISOString(),
        segmentId: u.unitDin || u.unitId,
        collectionDate: donation?.collectedAt ? donation.collectedAt.toISOString() : u.collectedAt.toISOString(),
        expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
        status: 'DISCARDED',
        initialVitals: {
          bp: donation?.medicalExam?.bloodPressure ? `${donation.medicalExam.bloodPressure.systolic}/${donation.medicalExam.bloodPressure.diastolic}` : 'N/A',
          hb: donation?.medicalExam?.hbGdl ?? 'N/A',
          weightKg: donation?.medicalExam?.weightKg ?? 'N/A',
          pulse: donation?.medicalExam?.pulseBpm ?? 'N/A',
          tempC: donation?.medicalExam?.temperatureCelsius ?? 'N/A'
        },
        donorId: donor?.donorId || 'N/A',
        firstName: donor?.name?.firstName || 'N/A',
        middleName: donor?.name?.middleName || '',
        lastName: donor?.name?.lastName || 'N/A',
        dob: donor?.dob ? (donor.dob instanceof Date ? donor.dob.toISOString().slice(0, 10) : new Date(donor.dob).toISOString().slice(0, 10)) : 'N/A',
        sex: donor?.sex || 'N/A',
        phone: donor?.phone || 'N/A',
        email: donor?.email || 'N/A',
        bloodGroup: donor?.bloodGroup || 'N/A',
        rh: donor?.rh === 'NEGATIVE' ? 'Negative' : 'Positive',
        testResults: testResultsStr
      };
    });

    res.json({
      success: true,
      data,
      pagination: {
        total,
        totalFiltered: total,
        totalPages: Math.ceil(total / limitNum),
        page: pageNum,
        limit: limitNum,
      }
    });
  } catch (e) {
    next(e);
  }
});

// POST /discard/create
router.post('/discard/create', authenticate, async (req, res, next) => {
  try {
    const { bagNo, batchNo, segmentNo, reason, description } = req.body;
    const actorId = (req.user as any)?.id;

    if (!bagNo) {
      return res.status(400).json({ success: false, message: 'Bag number (bagNo) is required.' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Discard reason is required.' });
    }

    // 1. Find donation
    const donation = await DonationModel.findOne({
      $or: [
        { donationId: bagNo },
        { bagNo: bagNo }
      ],
      deletedAt: null
    });

    if (!donation) {
      return res.status(404).json({ success: false, message: `No donation found matching bag number: ${bagNo}` });
    }

    // 2. Find all non-deleted units under this donationId
    const units = await BloodUnitModel.find({
      donationId: donation.donationId,
      deletedAt: null
    });

    if (units.length === 0) {
      return res.status(404).json({ success: false, message: `No blood units found for donation: ${donation.donationId}` });
    }

    // 3. Mark each unit as DISCARDED and clean up allocations
    for (const unit of units) {
      const oldStatus = unit.status;
      unit.status = 'DISCARDED';
      unit.discardReason = reason;
      unit.discardNotes = description || undefined;

      // Clear reservation details
      unit.reservedFor = null;
      unit.reservedUntil = null;
      unit.reservedAt = null;

      unit.statusHistory.push({
        from: oldStatus,
        to: 'DISCARDED',
        event: 'MANUAL_DISCARD',
        actor: new Types.ObjectId(actorId),
        at: new Date(),
        reason: `Manually discarded via procurement portal. Description: ${description || 'N/A'}. Segment: ${segmentNo || donation.segmentNo || 'N/A'}, Batch: ${batchNo || donation.lotNo || 'N/A'}`
      } as any);
      await unit.save();

      // Clean up from any requisition matchedUnits
      const reqs = await RequisitionModel.find({ "matchedUnits.unitId": unit.unitId });
      for (const r of reqs) {
        r.matchedUnits = r.matchedUnits.filter((mu: any) => mu.unitId !== unit.unitId) as any;
        if (r.matchedUnits.length === 0 && ['MATCHED', 'CROSSMATCHED', 'APPROVED'].includes(r.status)) {
          r.status = 'PENDING';
        }
        await r.save();
      }
    }

    // Update TtiResult if reason is TTI_POSITIVE
    if (reason === 'TTI_POSITIVE' && req.body.ttiResults) {
      const { ttiResults } = req.body;
      const actorObjId = new Types.ObjectId(actorId);

      const testsArray = [
        { testName: 'HIV', method: 'ELISA', result: ttiResults.HIV || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
        { testName: 'HBSAG', method: 'ELISA', result: ttiResults.HBSAG || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
        { testName: 'HCV', method: 'ELISA', result: ttiResults.HCV || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
        { testName: 'SYPHILIS', method: 'ELISA', result: ttiResults.SYPHILIS || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() },
        { testName: 'MALARIA', method: 'ELISA', result: ttiResults.MALARIA || 'NEGATIVE', technicianId: actorObjId, performedAt: new Date() }
      ];

      let ttiResult = await TtiResultModel.findOne({ donationId: donation.donationId });
      if (ttiResult) {
        ttiResult.tests = testsArray as any;
        ttiResult.releaseDecision = 'reactive';
        ttiResult.updatedBy = actorObjId;
        await ttiResult.save();
      } else {
        await TtiResultModel.create({
          donationId: donation.donationId,
          tests: testsArray,
          releaseDecision: 'reactive',
          createdBy: actorObjId,
          updatedBy: actorObjId
        });
      }
    }

    // Also update the donation itself
    if (segmentNo) donation.segmentNo = segmentNo;
    if (batchNo) donation.lotNo = batchNo;
    await donation.save();

    // Invalidate inventory summary caching so the stock view gets updated instantly
    await invalidate('inventory:*');

    res.json({
      success: true,
      message: `Successfully discarded ${units.length} blood unit(s) associated with bag number ${bagNo}.`
    });
  } catch (e) {
    next(e);
  }
});

// GET /donation/lookup/:bagNo
router.get('/donation/lookup/:bagNo', authenticate, async (req, res, next) => {
  try {
    const { bagNo } = req.params;
    const donation = await DonationModel.findOne({
      $or: [
        { donationId: bagNo },
        { bagNo: bagNo }
      ],
      deletedAt: null
    }).lean();

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    res.json({
      success: true,
      data: {
        lotNo: donation.lotNo || '',
        segmentNo: donation.segmentNo || ''
      }
    });
  } catch (e) {
    next(e);
  }
});


// Helper for mapping TtiResult to bag representation
async function mapTtiBags(ttis: any[]) {
  const donationIds = ttis.map(t => t.donationId);
  const donations = await DonationModel.find({ donationId: { $in: donationIds }, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] })
    .populate('campId', 'name')
    .lean();

  const donationMap = new Map(donations.map(d => [d.donationId, d]));

  const units = await BloodUnitModel.find({ donationId: { $in: donationIds }, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }).lean();
  const unitsMap: Record<string, typeof units> = {};
  units.forEach(u => {
    if (u.donationId) {
      let arr = unitsMap[u.donationId];
      if (!arr) {
        arr = [];
        unitsMap[u.donationId] = arr;
      }
      arr.push(u);
    }
  });

  const inspections = await BagInspectionModel.find({ bagNo: { $in: donationIds }, deletedAt: null }).lean();
  const inspectionMap = new Map(inspections.map(i => [i.bagNo, i]));

  return ttis.map(t => {
    const d = donationMap.get(t.donationId);
    const uList = unitsMap[t.donationId] || [];
    if (!d) return null;

    const existingTests = t.tests || [];
    const testResults = existingTests.map((et: any) => {
      let testName = et.testName;
      if (testName === 'SYPHILIS') testName = 'VDRL';
      if (testName === 'MALARIA') testName = 'MP';

      let resVal = et.result;
      if (resVal === 'INDETERMINATE') resVal = 'Shadeness';

      return {
        test: testName,
        result: resVal
      };
    });

    const inspection = inspectionMap.get(t.donationId);
    const segmentNo = inspection?.segmentNo || uList[0]?.unitDin || uList[0]?.unitId || '';

    return {
      _id: t._id.toString(),
      bagNo: (d as any).bagNo || t.donationId,
      segmentNo: (d as any).segmentNo || segmentNo,
      bloodGroup: t.aboGroupConfirmed || uList[0]?.aboGroup || 'O',
      rh: t.rhFactorConfirmed === 'NEGATIVE' ? 'Negative' : 'Positive',
      siteId: d.campId ? { name: (d.campId as any).name } : null,
      collectionDate: d.collectedAt.toISOString(),
      status: t.releaseDecision === 'released' ? 'passed' : t.releaseDecision === 'reactive' ? 'failed' : 'pending',
      testResults
    };
  }).filter(Boolean);
}

// 3. GET /serology/bags
router.get('/serology/bags', authenticate, async (req, res, next) => {
  try {
    const { page, limit, search, order, fromDate, toDate } = req.query as any;

    const separatedDonationIds = await BloodUnitModel.distinct('donationId', {
      status: 'QUARANTINE',
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
    });

    const ttiFilter: any = {
      releaseDecision: 'pending',
      donationId: { $in: separatedDonationIds }
    };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingDonations = await DonationModel.find({
        $and: [
          {
            $or: [
              { donationId: searchRegex },
              { bagNo: searchRegex }
            ]
          },
          {
            $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
          }
        ]
      }).select('donationId').lean();

      const matchedDonationIds = matchingDonations.map(d => d.donationId);
      const targetIds = matchedDonationIds.filter(id => separatedDonationIds.includes(id));
      ttiFilter.donationId = { $in: targetIds };
    }

    if (fromDate || toDate) {
      const collectedAtRange: any = {};
      if (fromDate) collectedAtRange.$gte = new Date(fromDate);
      if (toDate) collectedAtRange.$lte = new Date(`${toDate}T23:59:59`);
      const donationsInRange = await DonationModel.find({
        donationId: { $in: ttiFilter.donationId.$in },
        collectedAt: collectedAtRange,
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
      }).select('donationId').lean();
      ttiFilter.donationId = { $in: donationsInRange.map(d => d.donationId) };
    }


    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skipNum = (pageNum - 1) * limitNum;

    const sortDir = order === 'asc' ? 1 : -1;

    const total = await TtiResultModel.countDocuments(ttiFilter);
    const ttis = await TtiResultModel.find(ttiFilter)
      .sort({ createdAt: sortDir })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const data = await mapTtiBags(ttis);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        page: pageNum,
        limit: limitNum,
      }
    });
  } catch (e) {
    next(e);
  }
});

// 4. GET /serology/results
router.get('/serology/results', authenticate, async (req, res, next) => {
  try {
    const { page, limit, search, order, fromDate, toDate, status } = req.query as any;

    const ttiFilter: any = { releaseDecision: { $ne: 'pending' } };

    if (status && status !== 'all') {
      if (status === 'passed') {
        ttiFilter.releaseDecision = 'released';
      } else if (status === 'failed' || status === 'discarded') {
        ttiFilter.releaseDecision = 'reactive';
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingDonations = await DonationModel.find({
        $and: [
          {
            $or: [
              { donationId: searchRegex },
              { bagNo: searchRegex }
            ]
          },
          {
            $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
          }
        ]
      }).select('donationId').lean();

      const matchedDonationIds = matchingDonations.map(d => d.donationId);
      ttiFilter.donationId = { $in: matchedDonationIds };
    }

    if (fromDate || toDate) {
      ttiFilter.decidedAt = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setUTCHours(0, 0, 0, 0);
        ttiFilter.decidedAt.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setUTCHours(23, 59, 59, 999);
        ttiFilter.decidedAt.$lte = end;
      }
    }


    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const sortDir = order === 'asc' ? 1 : -1;

    const total = await TtiResultModel.countDocuments(ttiFilter);
    const ttis = await TtiResultModel.find(ttiFilter)
      .sort({ decidedAt: sortDir })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const data = await mapTtiBags(ttis);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        page: pageNum,
        limit: limitNum,
      }
    });
  } catch (e) {
    next(e);
  }
});

// 5. POST /serology/results/:id
router.post('/serology/results/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { testResults, technicianId } = req.body;
    const actorId = (req.user as any)?.id;

    if (!actorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let ttiDoc = await TtiResultModel.findById(id);
    if (!ttiDoc && typeof id === 'string' && Types.ObjectId.isValid(id)) {
      ttiDoc = await TtiResultModel.findOne({ donationId: id });
    }
    if (!ttiDoc) {
      return res.status(404).json({ success: false, message: 'TtiResult not found' });
    }

    const donationId = ttiDoc.donationId;

    const mappedTests = testResults.map((t: any) => {
      let testName = t.test.toUpperCase();
      if (testName === 'VDRL') testName = 'SYPHILIS';
      if (testName === 'MP') testName = 'MALARIA';

      let result = t.result.toUpperCase();
      if (result === 'SHADENESS') result = 'INDETERMINATE';

      return {
        testName,
        method: 'ELISA',
        result,
        technicianId: technicianId || actorId,
        performedAt: new Date(),
      };
    });

    await ttiService.recordTests(donationId, mappedTests, actorId);
    await ttiService.finalize(donationId, actorId);

    res.json({ success: true, message: 'Serology results saved and finalized successfully' });
  } catch (e) {
    next(e);
  }
});

// Legacy helper for component type mapping
const toLegacyComponentType = (type: string) => {
  if (type === 'PRBC') return 'RBC';
  if (type === 'PLATELET_CONCENTRATE') return 'Platelet';
  if (type === 'CRYOPRECIPITATE') return 'Cryo';
  return type;
};

// GET /mis/donors
router.get('/mis/donors', authenticate, async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query as any;
    const dateRange: any = {};
    if (fromDate) dateRange.$gte = new Date(fromDate);
    if (toDate) dateRange.$lte = new Date(`${toDate}T23:59:59`);
    const dateMatch = (fromDate || toDate) ? { createdAt: dateRange } : {};

    const total = await DonorModel.countDocuments({ deletedAt: null, ...dateMatch });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await DonorModel.countDocuments({ createdAt: { $gte: startOfMonth }, deletedAt: null });

    const active = await DonorModel.countDocuments({ eligibilityStatus: 'eligible', deletedAt: null, ...dateMatch });

    const gender = await DonorModel.aggregate([
      { $match: { deletedAt: null, ...dateMatch } },
      { $group: { _id: '$sex', count: { $sum: 1 } } }
    ]);

    const bloodGroupAgg = await DonorModel.aggregate([
      { $match: { deletedAt: null, ...dateMatch } },
      { $group: { _id: { bg: '$bloodGroup', rh: '$rh' }, count: { $sum: 1 } } }
    ]);
    const bloodGroup = bloodGroupAgg.map(g => {
      const bg = g._id?.bg || 'Unknown';
      const rh = g._id?.rh || 'Positive';
      return {
        _id: `${bg}${rh === 'NEGATIVE' ? '-' : '+'}`,
        count: g.count
      };
    });

    const city = await DonorModel.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const donors = await DonorModel.find({ deletedAt: null }).lean();
    const now = new Date();
    const buckets = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
    donors.forEach((d: any) => {
      if (!d.dob) return;
      const age = now.getFullYear() - new Date(d.dob).getFullYear();
      if (age >= 18 && age <= 25) buckets['18-25']++;
      else if (age >= 26 && age <= 35) buckets['26-35']++;
      else if (age >= 36 && age <= 45) buckets['36-45']++;
      else if (age >= 46 && age <= 55) buckets['46-55']++;
      else if (age >= 56) buckets['56+']++;
    });
    const age = Object.entries(buckets).map(([k, v]) => ({ _id: k, count: v }));

    const donationCounts = await DonationModel.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$donor', count: { $sum: 1 } } }
    ]);
    const repeatCount = donationCounts.filter(d => d.count > 1).length;
    const repeatPercentage = total > 0 ? Math.round((repeatCount / total) * 100) : 0;

    const donorsList = await DonorModel.find({ deletedAt: null, ...dateMatch })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('donorId name bloodGroup rh sex address phone lastDonationDate')
      .lean();

    const mappedDonors = donorsList.map((d: any) => ({
      _id: d._id.toString(),
      donorId: d.donorId,
      name: d.name,
      bloodGroup: d.bloodGroup,
      rh: d.rh === 'NEGATIVE' ? '-' : '+',
      sex: d.sex,
      address: { city: d.address?.city || '' },
      phone: d.phone,
      lastDonationDate: d.lastDonationDate
    }));

    res.json({
      success: true,
      data: {
        stats: { total, newThisMonth, active, gender, bloodGroup, age, city },
        behavior: { repeatPercentage },
        register: { donors: mappedDonors }
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /mis/donations
router.get('/mis/donations', authenticate, async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query as any;
    const dateRange: any = {};
    if (fromDate) dateRange.$gte = new Date(fromDate);
    if (toDate) dateRange.$lte = new Date(`${toDate}T23:59:59`);
    const dateMatch = (fromDate || toDate) ? { collectedAt: dateRange } : {};

    const total = await DonationModel.countDocuments({ deletedAt: null, ...dateMatch });

    const byBloodGroupAgg = await DonationModel.aggregate([
      { $match: { deletedAt: null, ...dateMatch } },
      {
        $lookup: {
          from: 'donors',
          localField: 'donor',
          foreignField: '_id',
          as: 'donorInfo'
        }
      },
      { $unwind: '$donorInfo' },
      {
        $group: {
          _id: { $concat: ['$donorInfo.bloodGroup', { $cond: [{ $eq: ['$donorInfo.rh', 'NEGATIVE'] }, '-', '+'] }] },
          count: { $sum: 1 }
        }
      }
    ]);

    const bySite = await DonationModel.aggregate([
      { $match: { deletedAt: null, ...dateMatch } },
      {
        $lookup: {
          from: 'camps',
          localField: 'campId',
          foreignField: '_id',
          as: 'campInfo'
        }
      },
      {
        $group: {
          _id: { $ifNull: [{ $arrayElemAt: ['$campInfo.name', 0] }, 'In-house'] },
          count: { $sum: 1 }
        }
      }
    ]);

    const byGender = await DonationModel.aggregate([
      { $match: { deletedAt: null, ...dateMatch } },
      {
        $lookup: {
          from: 'donors',
          localField: 'donor',
          foreignField: '_id',
          as: 'donorInfo'
        }
      },
      { $unwind: '$donorInfo' },
      { $group: { _id: '$donorInfo.sex', count: { $sum: 1 } } }
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trendsAgg = await DonationModel.aggregate([
      { $match: { collectedAt: { $gte: thirtyDaysAgo }, deletedAt: null } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const trends = trendsAgg.map(t => ({ date: t._id, count: t.count }));

    res.json({
      success: true,
      data: {
        summary: { total },
        breakdowns: { byBloodGroup: byBloodGroupAgg, bySite, byGender },
        trends
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /mis/camps
router.get('/mis/camps', authenticate, async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query as any;
    const campDateMatch: any = {};
    if (fromDate || toDate) {
      const range: any = {};
      if (fromDate) range.$gte = new Date(fromDate);
      if (toDate) range.$lte = new Date(`${toDate}T23:59:59`);
      campDateMatch.dateFrom = range;
    }
    const camps = await CampModel.find(campDateMatch).lean();
    const campIds = camps.map(c => c._id);

    const donationsByCamp = await DonationModel.aggregate([
      { $match: { campId: { $in: campIds }, deletedAt: null } },
      { $group: { _id: '$campId', count: { $sum: 1 } } }
    ]);
    const donationMap = new Map(donationsByCamp.map(d => [d._id.toString(), d.count]));

    const discardedByCamp = await BloodUnitModel.aggregate([
      { $match: { campId: { $in: campIds }, status: 'DISCARDED', deletedAt: null } },
      { $group: { _id: '$campId', count: { $sum: 1 } } }
    ]);
    const discardedMap = new Map(discardedByCamp.map(d => [d._id.toString(), d.count]));

    const reactiveByCamp = await TtiResultModel.aggregate([
      { $match: { releaseDecision: 'reactive' } },
      {
        $lookup: {
          from: 'donations',
          localField: 'donationId',
          foreignField: 'donationId',
          as: 'donation'
        }
      },
      { $unwind: '$donation' },
      { $match: { 'donation.campId': { $in: campIds } } },
      { $group: { _id: '$donation.campId', count: { $sum: 1 } } }
    ]);
    const reactiveMap = new Map(reactiveByCamp.map(r => [r._id.toString(), r.count]));

    const data = camps.map(camp => {
      const cid = camp._id.toString();
      return {
        name: camp.name,
        address: camp.address,
        dateFrom: camp.dateFrom,
        dateTo: camp.dateTo,
        totalBags: donationMap.get(cid) || 0,
        discardedBags: discardedMap.get(cid) || 0,
        serologyFailures: reactiveMap.get(cid) || 0
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /mis/bags
router.get('/mis/bags', authenticate, async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query as any;
    const dateRange: any = {};
    if (fromDate) dateRange.$gte = new Date(fromDate);
    if (toDate) dateRange.$lte = new Date(`${toDate}T23:59:59`);
    const dateMatch = (fromDate || toDate) ? { collectedAt: dateRange } : {};

    const ttiStats = await TtiResultModel.aggregate([
      { $group: { _id: '$releaseDecision', count: { $sum: 1 } } }
    ]);
    const stats = ttiStats.map(s => {
      let status = 'testing';
      if (s._id === 'released') status = 'passed';
      else if (s._id === 'reactive') status = 'failed';
      else if (s._id === 'pending') status = 'testing';
      return { _id: status, count: s.count };
    });

    const donations = await DonationModel.find({ deletedAt: null, ...dateMatch })
      .sort({ collectedAt: -1 })
      .limit(100)
      .populate('donor', 'donorId bloodGroup rh')
      .populate('campId', 'name')
      .lean();

    const donationIds = donations.map(d => d.donationId);
    const ttis = await TtiResultModel.find({ donationId: { $in: donationIds } }).lean();
    const ttiMap = new Map(ttis.map(t => [t.donationId, t.releaseDecision]));

    const bags = donations.map((d: any) => {
      const decision = ttiMap.get(d.donationId) || 'pending';
      let status = 'testing';
      if (decision === 'released') status = 'passed';
      else if (decision === 'reactive') status = 'failed';

      const donor = d.donor;
      const bgStr = donor ? `${donor.bloodGroup}${donor.rh === 'NEGATIVE' ? '-' : '+'}` : 'Unknown';

      return {
        _id: d._id.toString(),
        bagNo: d.bagNo || d.donationId,
        donor: { donorId: donor?.donorId || '-' },
        bloodGroup: bgStr,
        collectionDate: d.collectedAt,
        status,
        siteId: { name: d.campId ? d.campId.name : 'In-house' }
      };
    });

    res.json({
      success: true,
      data: {
        stats,
        register: { bags }
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /mis/components
router.get('/mis/components', authenticate, async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query as any;
    const dateRange: any = {};
    if (fromDate) dateRange.$gte = new Date(fromDate);
    if (toDate) dateRange.$lte = new Date(`${toDate}T23:59:59`);
    const dateMatch = (fromDate || toDate) ? { collectedAt: dateRange } : {};

    const productionAgg = await BloodUnitModel.aggregate([
      { $match: { deletedAt: null, ...dateMatch } },
      {
        $group: {
          _id: '$componentType',
          count: { $sum: 1 },
          avgVolume: { $avg: '$volumeMl' }
        }
      }
    ]);
    const production = productionAgg.map(p => ({
      _id: toLegacyComponentType(p._id),
      count: p.count,
      avgVolume: p.avgVolume || 0
    }));

    const units = await BloodUnitModel.find({ deletedAt: null, ...dateMatch }).lean();
    const now = new Date();
    const buckets = { '0-5': 0, '6-10': 0, '11-20': 0, '21-35': 0, '36+': 0 };
    units.forEach((u: any) => {
      if (!u.collectedAt) return;
      const diffMs = now.getTime() - new Date(u.collectedAt).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 5) buckets['0-5']++;
      else if (diffDays >= 6 && diffDays <= 10) buckets['6-10']++;
      else if (diffDays >= 11 && diffDays <= 20) buckets['11-20']++;
      else if (diffDays >= 21 && diffDays <= 35) buckets['21-35']++;
      else if (diffDays >= 36) buckets['36+']++;
    });
    const ageing = Object.entries(buckets).map(([k, v]) => ({ _id: k, count: v }));

    const status = await BloodUnitModel.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: { production, ageing, status }
    });
  } catch (err) {
    next(err);
  }
});

// GET /mis/inventory
router.get('/mis/inventory', authenticate, async (req, res, next) => {
  try {
    const inventoryAgg = await BloodUnitModel.aggregate([
      { $match: { status: { $in: ['RELEASED', 'RESERVED', 'CROSSMATCHED'] }, deletedAt: null } },
      {
        $group: {
          _id: {
            type: '$componentType',
            group: '$aboGroup',
            rh: { $cond: [{ $eq: ['$rhFactor', 'NEGATIVE'] }, 'Negative', 'Positive'] }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const data = inventoryAgg.map(item => ({
      _id: {
        type: toLegacyComponentType(item._id.type),
        group: item._id.group,
        rh: item._id.rh
      },
      count: item.count
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
