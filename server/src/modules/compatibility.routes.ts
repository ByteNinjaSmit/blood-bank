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
    const { page, limit, status, componentType, siteId, search, sortBy, order } = req.query as any;

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

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';

    const total = await BloodUnitModel.countDocuments(unitFilter);
    const units = await BloodUnitModel.find(unitFilter)
      .populate({
        path: 'reservedFor',
        populate: [
          { path: 'hospitalId', select: 'name' },
          { path: 'patientId', select: 'name dob sex' }
        ]
      })
      .sort({ [sortField]: sortDir })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const donationIds = units.map(u => u.donationId).filter(Boolean);
    const donations = await DonationModel.find({
      donationId: { $in: donationIds },
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
    }).select('donationId bagNo segmentNo typeOfBag').lean();

    const donationMap = new Map<string, { bagNo: string; segmentNo?: string | null; typeOfBag?: string }>();
    donations.forEach(d => {
      if (d.donationId && d.bagNo) {
        donationMap.set(d.donationId, { bagNo: d.bagNo, segmentNo: d.segmentNo, typeOfBag: d.typeOfBag || undefined });
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
      const segmentNo = donObj?.segmentNo || u.unitDin || u.unitId || '—';
      const typeOfBag = donObj?.typeOfBag || 'SB';

      if (u.storageLocation) {
        hospitalName = u.storageLocation;
      } else if (u.thalassemiaPatient) {
        const p = u.thalassemiaPatient;
        hospitalName = `Thalassemia: ${p.firstName} ${p.lastName} (${p.bloodGroup})`;
      }

      return {
        _id: u._id.toString(),
        bagNo: displayBagNo,
        segmentNo,
        storageLocation: u.storageLocation || undefined,
        thalassemiaPatient: u.thalassemiaPatient || undefined,
        typeOfBag,
        bag: {
          bagNo: displayBagNo,
          bloodGroup: u.aboGroup,
          rh: u.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
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
      };
    });

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
    const { location, otherLocationName, bags, userId, dispatchType, thalassemiaPatient } = req.body;
    const actorId = (req.user as any)?.id || userId;
    const isThalassemia = dispatchType === 'THALASSEMIA';

    let finalLocation = null;
    if (!isThalassemia) {
      if (!location) {
        return res.status(400).json({ success: false, message: 'Location is required' });
      }
      finalLocation = location === 'Others' ? otherLocationName : location;
      if (!finalLocation) {
        return res.status(400).json({ success: false, message: 'Location name is required' });
      }
    } else {
      if (!thalassemiaPatient || !thalassemiaPatient.firstName || !thalassemiaPatient.lastName) {
        return res.status(400).json({ success: false, message: 'Patient details are required' });
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
      unit.issuedAt = new Date();
      unit.updatedBy = actorObjId;

      if (isThalassemia) {
        (unit as any).storageLocation = null;
        (unit as any).thalassemiaPatient = thalassemiaPatient;
        unit.statusHistory.push({
          from: oldStatus,
          to: 'ISSUED',
          event: 'ISSUE',
          actor: actorObjId,
          at: new Date(),
          reason: `Issued to Thalassemia Patient: ${thalassemiaPatient.firstName} ${thalassemiaPatient.lastName}`,
        } as any);
      } else {
        unit.storageLocation = finalLocation;
        (unit as any).thalassemiaPatient = null;
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

    res.json({ success: true, message: isThalassemia ? 'Blood units successfully issued to Thalassemia patient.' : 'Blood units successfully sent to storage.' });
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
    const { page, limit, search, order } = req.query as any;

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

// 6. GET /dashboard
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const user = req.user ? await UserModel.findById(req.user.id).lean() : null;
    const siteId = user?.campId || null;
    const now = new Date();
    const { range, rangeDays, from, to } = req.query || {};

    const toDate = to ? new Date(to as string) : now;
    toDate.setHours(23, 59, 59, 999);

    let fromDate: Date | null = null;
    if (from) {
      const f = new Date(from as string);
      f.setHours(0, 0, 0, 0);
      fromDate = f;
    } else if (typeof rangeDays !== 'undefined' && !Number.isNaN(parseInt(rangeDays as string, 10))) {
      const days = Math.max(1, parseInt(rangeDays as string, 10));
      fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (range && String(range).toLowerCase() === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      fromDate = start;
    } else if (range && ['1d', '2d', '7d', '30d'].includes(String(range).toLowerCase())) {
      const map: Record<string, number> = { '1d': 1, '2d': 2, '7d': 7, '30d': 30 };
      const days = map[String(range).toLowerCase()] || 30;
      fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (range && String(range).toLowerCase() === 'all') {
      fromDate = null; // no time filter
    } else {
      fromDate = new Date(toDate.getTime() - 7 * 24 * 60 * 60 * 1000); // default to 7 days
    }

    const siteMatchBag = siteId ? { campId: siteId } : {};
    const siteMatchComponent = siteId ? { campId: siteId } : {};

    const [donorsTotal, donationsTotal, compInStock, compReserved, compDiscarded, compIssued] =
      await Promise.all([
        DonorModel.countDocuments({ deletedAt: null }),
        DonationModel.countDocuments({ ...siteMatchBag, deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'RELEASED', ...siteMatchComponent, deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'RESERVED', ...siteMatchComponent, deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'DISCARDED', ...siteMatchComponent, deletedAt: null }),
        BloodUnitModel.countDocuments({ status: 'ISSUED', ...siteMatchComponent, deletedAt: null }),
      ]);

    const issuedTotal = compIssued;

    const matchDate = (field: string) => (fromDate ? { [field]: { $gte: fromDate, $lte: toDate } } : {});

    const [
      stockByGroupAgg,
      stockByComponentAgg,
      stockByComponentAndGroupAgg,
      donationsTrendAgg,
      issuedTrendAgg,
      discardedTrendAgg,
    ] = await Promise.all([
      // Stock by ABO/Rh
      BloodUnitModel.aggregate([
        {
          $match: {
            status: 'RELEASED',
            ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchComponent,
            deletedAt: null
          }
        },
        { $group: { _id: { bloodGroup: '$aboGroup', rhFactor: '$rhFactor' }, count: { $sum: 1 } } },
      ]),
      // Stock by component type
      BloodUnitModel.aggregate([
        {
          $match: {
            status: 'RELEASED',
            ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchComponent,
            deletedAt: null
          }
        },
        { $group: { _id: '$componentType', count: { $sum: 1 } } },
      ]),
      // Stock by Component and ABO/Rh
      BloodUnitModel.aggregate([
        {
          $match: {
            status: 'RELEASED',
            ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchComponent,
            deletedAt: null
          }
        },
        {
          $group: {
            _id: {
              componentType: '$componentType',
              bloodGroup: '$aboGroup',
              rhFactor: '$rhFactor'
            },
            count: { $sum: 1 }
          }
        }
      ]),
      // Donations trend
      DonationModel.aggregate([
        {
          $match: {
            ...(fromDate ? { collectedAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchBag,
            deletedAt: null
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectedAt' } },
            value: { $sum: 1 },
          },
        },
      ]),
      // Issued trend
      BloodUnitModel.aggregate([
        {
          $match: {
            status: 'ISSUED',
            ...(fromDate ? { updatedAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchComponent,
            deletedAt: null
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            value: { $sum: 1 },
          },
        },
      ]),
      // Discarded trend
      BloodUnitModel.aggregate([
        {
          $match: {
            status: 'DISCARDED',
            ...(fromDate ? { updatedAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchComponent,
            deletedAt: null
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
            value: { $sum: 1 },
          },
        },
      ]),
    ]);

    const nearExpiryAgg = await BloodUnitModel.aggregate([
      {
        $match: {
          status: 'RELEASED',
          expiresAt: { $ne: null },
          ...siteMatchComponent,
          deletedAt: null
        }
      },
      {
        $addFields: {
          daysToExpiry: { $ceil: { $divide: [{ $subtract: ['$expiresAt', now] }, 86400000] } },
          threshold: {
            $switch: {
              branches: [
                { case: { $in: ['$componentType', ['PLATELET_CONCENTRATE', 'SDP']] }, then: 1 },
                { case: { $in: ['$componentType', ['PRBC', 'IRRADIATED_PRBC', 'WASHED_PRBC', 'LEUKOREDUCED_PRBC']] }, then: 7 },
                { case: { $eq: ['$componentType', 'FFP'] }, then: 30 },
                { case: { $eq: ['$componentType', 'CRYOPRECIPITATE'] }, then: 30 }
              ],
              default: 7,
            },
          },
        },
      },
      {
        $match: {
          $expr: {
            $and: [{ $gte: ['$daysToExpiry', 0] }, { $lte: ['$daysToExpiry', '$threshold'] }],
          },
        },
      },
      { $group: { _id: '$componentType', count: { $sum: 1 } } },
    ]);

    const matchDateHR = fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {};

    const [requestsByStatusAgg, totalUnitsRequestedAgg] = await Promise.all([
      RequisitionModel.aggregate([
        { $match: { ...matchDateHR, deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      RequisitionModel.aggregate([
        { $match: { ...matchDateHR, deletedAt: null } },
        { $unwind: '$requestedComponents' },
        { $group: { _id: null, units: { $sum: '$requestedComponents.units' } } },
      ]),
    ]);

    const campDonationIds = await DonationModel.find({
      campId: { $ne: null },
      ...(fromDate ? { collectedAt: { $gte: fromDate, $lte: toDate } } : {}),
      ...siteMatchBag,
      deletedAt: null
    }).distinct('donationId');

    const campDonationsForSiteId = siteId ? await DonationModel.find({ campId: siteId, deletedAt: null }).distinct('donationId') : null;
    const siteMatchTti = campDonationsForSiteId ? { donationId: { $in: campDonationsForSiteId } } : {};

    const [
      transfusionsInRange,
      discardsAgg,
      positivityAgg,
      bloodUnitStatusAgg,
      donationsInRange,
      issuedInRange,
      discardedInRange,
      inStockInRange,
      reservedInRange,
      campDonorsList,
      campFailures,
      bagsPassed,
      bagsFailed,
      bagsPending,
      bagsQuarantined,
    ] = await Promise.all([
      TransfusionModel.countDocuments({
        ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {})
      }),
      BloodUnitModel.aggregate([
        {
          $match: {
            status: 'DISCARDED',
            ...(fromDate ? { updatedAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchComponent,
            deletedAt: null
          }
        },
        { $group: { _id: '$discardReason', count: { $sum: 1 } } },
      ]),
      TtiResultModel.aggregate([
        ...(siteId ? [
          {
            $lookup: {
              from: 'donations',
              localField: 'donationId',
              foreignField: 'donationId',
              as: 'donation'
            }
          },
          { $unwind: '$donation' },
          { $match: { 'donation.campId': siteId } }
        ] : []),
        { $unwind: '$tests' },
        ...(fromDate ? [{ $match: { 'tests.performedAt': { $gte: fromDate, $lte: toDate } } }] : []),
        {
          $group: {
            _id: { test: '$tests.testName', result: '$tests.result' },
            count: { $sum: 1 },
          },
        },
      ]),
      BloodUnitModel.aggregate([
        {
          $match: {
            ...(fromDate ? { collectedAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchComponent,
            deletedAt: null
          }
        },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      DonationModel.countDocuments({
        ...(fromDate ? { collectedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchBag,
        deletedAt: null
      }),
      BloodUnitModel.countDocuments({
        status: 'ISSUED',
        ...(fromDate ? { updatedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchComponent,
        deletedAt: null
      }),
      BloodUnitModel.countDocuments({
        status: 'DISCARDED',
        ...(fromDate ? { updatedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchComponent,
        deletedAt: null
      }),
      BloodUnitModel.countDocuments({
        status: 'RELEASED',
        ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchComponent,
        deletedAt: null
      }),
      BloodUnitModel.countDocuments({
        status: 'RESERVED',
        ...(fromDate ? { updatedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchComponent,
        deletedAt: null
      }),
      DonationModel.find({
        campId: { $ne: null },
        ...(fromDate ? { collectedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchBag,
        deletedAt: null
      }).distinct('donor'),
      TtiResultModel.countDocuments({
        donationId: { $in: campDonationIds },
        releaseDecision: 'reactive'
      }),
      TtiResultModel.countDocuments({
        releaseDecision: 'released',
        ...(fromDate ? { decidedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchTti
      }),
      TtiResultModel.countDocuments({
        releaseDecision: 'reactive',
        ...(fromDate ? { decidedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchTti
      }),
      TtiResultModel.countDocuments({
        releaseDecision: 'pending',
        ...(fromDate ? { decidedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchTti
      }),
      TtiResultModel.countDocuments({
        releaseDecision: 'on-hold',
        ...(fromDate ? { decidedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchTti
      })
    ]);

    const toLegacyComponentType = (type: string) => {
      if (type === 'PRBC') return 'RBC';
      if (type === 'PLATELET_CONCENTRATE') return 'Platelet';
      if (type === 'CRYOPRECIPITATE') return 'Cryo';
      return type;
    };

    const startForSeries = fromDate || new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const daysBetween = Math.max(1, Math.ceil((toDate.getTime() - startForSeries.getTime()) / 86400000));
    const dateRange = Array.from({ length: daysBetween }, (_, i) => {
      const d = new Date(startForSeries.getTime() + i * 86400000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    });

    const toSeries = (agg: any[]) => {
      const map = new Map(agg.map((x) => [x._id, x.value]));
      return dateRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
    };

    const donationsTrend = toSeries(donationsTrendAgg);
    const issuedTrend = toSeries(issuedTrendAgg);
    const discardedTrend = toSeries(discardedTrendAgg);

    const stockByGroup = stockByGroupAgg.map((x) => ({
      bloodGroup: x._id?.bloodGroup || 'Unknown',
      rh: x._id?.rhFactor === 'NEGATIVE' ? 'Negative' : 'Positive',
      value: x.count,
    }));
    const stockByComponent = stockByComponentAgg.map((x) => ({
      componentType: toLegacyComponentType(x._id),
      value: x.count,
    }));
    const stockByComponentAndGroup = stockByComponentAndGroupAgg.map((x) => ({
      componentType: toLegacyComponentType(x._id?.componentType),
      bloodGroup: x._id?.bloodGroup || 'Unknown',
      rh: x._id?.rhFactor === 'NEGATIVE' ? 'Negative' : 'Positive',
      value: x.count,
    }));
    const nearExpiryByComponent = nearExpiryAgg.map((x) => ({
      componentType: toLegacyComponentType(x._id),
      value: x.count,
    }));
    const requestsByStatus = requestsByStatusAgg.map((x) => ({
      status: (x._id || 'unknown').toLowerCase(),
      value: x.count,
    }));
    const totalUnitsRequested = totalUnitsRequestedAgg?.[0]?.units || 0;

    const positivity: Record<string, { Reactive: number; Negative: number; Shadeness: number }> = {};
    positivityAgg.forEach((x) => {
      let testKey = x._id?.test || 'Unknown';
      if (testKey === 'HBSAG') testKey = 'HBsAg';
      else if (testKey === 'SYPHILIS') testKey = 'VDRL';
      else if (testKey === 'MALARIA') testKey = 'MP';

      let resultKey = x._id?.result || 'Unknown';
      if (resultKey === 'NEGATIVE') resultKey = 'Negative';
      else if (resultKey === 'REACTIVE') resultKey = 'Reactive';
      else if (resultKey === 'INDETERMINATE') resultKey = 'Shadeness';

      if (!positivity[testKey]) {
        positivity[testKey] = { Reactive: 0, Negative: 0, Shadeness: 0 };
      }
      const entry = positivity[testKey];
      if (entry) {
        if (resultKey === 'Reactive') entry.Reactive += x.count;
        else if (resultKey === 'Negative') entry.Negative += x.count;
        else if (resultKey === 'Shadeness') entry.Shadeness += x.count;
      }
    });

    const statusPieMap: Record<string, number> = {
      collected: 0,
      'component-separated': 0,
      testing: 0,
      passed: 0,
      failed: 0,
      quarantined: 0,
      issued: 0,
      discarded: 0,
    };
    bloodUnitStatusAgg.forEach((x) => {
      const status = x._id;
      if (status === 'COLLECTED') statusPieMap.collected += x.count;
      else if (status === 'IN_TESTING') statusPieMap.testing += x.count;
      else if (status === 'QUARANTINE') statusPieMap.quarantined += x.count;
      else if (['RELEASED', 'RESERVED', 'CROSSMATCHED'].includes(status)) statusPieMap.passed += x.count;
      else if (['ISSUED', 'TRANSFUSED'].includes(status)) statusPieMap.issued += x.count;
      else if (['DISCARDED', 'EXPIRED'].includes(status)) statusPieMap.discarded += x.count;
    });

    const bloodbagStatusPie = Object.entries(statusPieMap).map(([status, value]) => ({
      status,
      value,
    }));

    const donationsTrendMap = new Map(donationsTrendAgg.map((x) => [x._id, x.value]));
    const issuedTrendMap = new Map(issuedTrendAgg.map((x) => [x._id, x.value]));
    const discardedTrendMap = new Map(discardedTrendAgg.map((x) => [x._id, x.value]));

    const nearExpiryTotal = nearExpiryAgg.reduce((s, x) => s + (x.count || 0), 0);

    const donorDonationCounts = await DonationModel.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$donor', count: { $sum: 1 } } }
    ]);
    let firstTimeDonors = 0;
    let repeatDonors = 0;
    donorDonationCounts.forEach((d) => {
      if (d.count === 1) firstTimeDonors++;
      else if (d.count > 1) repeatDonors++;
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      maleDonors,
      femaleDonors,
      otherDonors,
      donorsFiltered,
      componentsProducedAgg,
      campsConducted,
      expiringToday,
      testsPending,
      delayedTesting,
      missingExpiry,
      inactiveDonors,
    ] = await Promise.all([
      DonorModel.countDocuments({ sex: 'M', deletedAt: null }),
      DonorModel.countDocuments({ sex: 'F', deletedAt: null }),
      DonorModel.countDocuments({ sex: 'O', deletedAt: null }),
      DonorModel.countDocuments({
        deletedAt: null,
        ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
      }),
      BloodUnitModel.aggregate([
        {
          $match: {
            ...(fromDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {}),
            ...siteMatchComponent,
            deletedAt: null
          }
        },
        { $group: { _id: '$componentType', count: { $sum: 1 } } },
      ]),
      CampModel.countDocuments({
        ...(fromDate ? { dateFrom: { $gte: fromDate, $lte: toDate } } : {})
      }),
      BloodUnitModel.countDocuments({
        status: 'RELEASED',
        expiresAt: { $gte: startOfToday, $lt: startOfTomorrow },
        ...siteMatchComponent,
        deletedAt: null
      }),
      TtiResultModel.countDocuments({
        releaseDecision: 'pending',
        ...(siteId ? { donationId: { $in: await DonationModel.find({ campId: siteId, deletedAt: null }).distinct('donationId') } } : {})
      }),
      TtiResultModel.countDocuments({
        releaseDecision: 'pending',
        createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        ...(siteId ? { donationId: { $in: await DonationModel.find({ campId: siteId, deletedAt: null }).distinct('donationId') } } : {})
      }),
      BloodUnitModel.countDocuments({
        status: 'RELEASED',
        expiresAt: null,
        ...siteMatchComponent,
        deletedAt: null
      }),
      DonorModel.countDocuments({
        deletedAt: null,
        $or: [
          { lastDonationDate: { $lt: sixMonthsAgo } },
          { lastDonationDate: null },
          { lastDonationDate: { $exists: false } }
        ]
      }),
    ]);

    const componentsProducedTotal = (componentsProducedAgg || []).reduce((sum, x) => sum + (x.count || 0), 0);
    const componentProducedMap = (componentsProducedAgg || []).reduce((acc: any, x) => {
      acc[toLegacyComponentType(x._id)] = x.count || 0;
      return acc;
    }, {});

    const stockByGroupMap = stockByGroup.reduce((acc: any, x) => {
      const key = `${x.bloodGroup || 'Unknown'}|${x.rh || 'Unknown'}`;
      acc[key] = x.value || 0;
      return acc;
    }, {});
    const stockFor = (group: string, rh: string) => stockByGroupMap[`${group}|${rh}`] || 0;

    const componentStockMap = stockByComponent.reduce((acc: any, x) => {
      acc[x.componentType] = x.value || 0;
      return acc;
    }, {});

    const requestsStatusMap = requestsByStatus.reduce((acc: any, x) => {
      acc[x.status] = x.value || 0;
      return acc;
    }, {});
    const totalRequests = requestsByStatus.reduce((sum, x) => sum + (x.value || 0), 0);

    const testsTotal = positivityAgg.reduce((sum, x) => sum + (x.count || 0), 0);

    const [donationsInHouse, donationsCamp] = await Promise.all([
      DonationModel.countDocuments({
        campId: null,
        ...(fromDate ? { collectedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchBag,
        deletedAt: null
      }),
      DonationModel.countDocuments({
        campId: { $ne: null },
        ...(fromDate ? { collectedAt: { $gte: fromDate, $lte: toDate } } : {}),
        ...siteMatchBag,
        deletedAt: null
      })
    ]);

    const ongoingCampsRaw = await CampModel.find({
      dateFrom: { $lte: now },
      dateTo: { $gte: now }
    }).populate('staff', 'name').lean();

    const ongoingCamps = ongoingCampsRaw.map((c: any) => ({
      id: c._id.toString(),
      campId: c.campId,
      name: c.name,
      address: c.address,
      dateFrom: c.dateFrom.toISOString(),
      dateTo: c.dateTo.toISOString(),
      staff: c.staff?.map((s: any) => s ? `${s.name?.first || ''} ${s.name?.last || ''}`.trim() : '').filter(Boolean) || [],
      donorsCount: c.donorData?.length || 0,
      unitsCount: c.unitData?.length || 0,
    }));

    const overview = {
      donorDonation: {
        donors: donorsTotal,
        newDonors: donorsFiltered,
        donations: donationsInRange,
        donationsInHouse,
        donationsCamp,
        maleDonors,
        femaleDonors,
        otherDonors,
        firstTimeDonors,
        repeatDonors,
      },
      bloodBags: {
        bagsCollected: donationsInRange,
        bagsTested: testsTotal,
        bagsPassed: bagsPassed,
        bagsFailed: bagsFailed,
        bagsPending: bagsPending,
        bagsQuarantined: bagsQuarantined,
      },
      components: {
        componentsProduced: componentsProducedTotal,
        rbcProduced: componentProducedMap.RBC || 0,
        pltProduced: componentProducedMap.Platelet || 0,
        ffpProduced: componentProducedMap.FFP || 0,
        cryoProduced: componentProducedMap.Cryo || 0,
      },
      inventory: {
        inStock:
          (componentStockMap.RBC || 0) +
          (componentStockMap.FFP || 0) +
          (componentStockMap.Platelet || 0) +
          (componentStockMap.Cryo || 0),
        reserved: reservedInRange,
        issued: issuedInRange,
        discarded: discardedInRange,
        nearExpiryTotal,
        expiredUnits: 0,
      },
      bloodGroups: {
        Opos: stockFor('O', 'Positive'),
        Oneg: stockFor('O', 'Negative'),
        Apos: stockFor('A', 'Positive'),
        Aneg: stockFor('A', 'Negative'),
        Bpos: stockFor('B', 'Positive'),
        Bneg: stockFor('B', 'Negative'),
        ABpos: stockFor('AB', 'Positive'),
        ABneg: stockFor('AB', 'Negative'),
      },
      componentAvailability: {
        rbcStock: componentStockMap.RBC || 0,
        pltStock: componentStockMap.Platelet || 0,
        ffpStock: componentStockMap.FFP || 0,
        cryoStock: componentStockMap.Cryo || 0,
      },
      hospitalRequests: {
        totalRequests,
        pendingRequests: requestsStatusMap.pending || 0,
        matchedRequests: requestsStatusMap.matched || 0,
        approvedRequests: requestsStatusMap.approved || 0,
        issuedRequests: requestsStatusMap.issued || 0,
        completedRequests: requestsStatusMap.completed || 0,
        rejectedRequests: requestsStatusMap.rejected || 0,
        totalUnitsRequested,
      },
      testingSerology: {
        testsTotal,
        hivPos: (positivity.HIV && positivity.HIV.Reactive) || 0,
        hbvPos: (positivity.HBsAg && positivity.HBsAg.Reactive) || 0,
        hcvPos: (positivity.HCV && positivity.HCV.Reactive) || 0,
        vdrlPos: (positivity.VDRL && positivity.VDRL.Reactive) || 0,
        mpPos: (positivity.MP && positivity.MP.Reactive) || 0,
      },
      camps: {
        campsConducted,
        campDonors: campDonorsList.length,
        campCollections: campDonationIds.length,
        campFailures,
      },
      alerts: {
        expiringToday,
        testsPending,
        delayedTesting,
        missingExpiry,
        inactiveDonors,
      },
    };

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          donors: donorsFiltered,
          donations: donationsInRange,
          inStock: inStockInRange,
          reserved: reservedInRange,
          issued: issuedInRange,
          discarded: discardedInRange,
          transfusions: transfusionsInRange,
        },
        stockByGroup,
        stockByComponent,
        stockByComponentAndGroup,
        nearExpiryByComponent,
        nearExpiryTotal,
        trends: {
          donations: donationsTrend,
          issued: issuedTrend,
          discarded: discardedTrend,
        },
        requests: {
          byStatus: requestsByStatus,
          totalUnitsRequested,
        },
        transfusionsLast30d: transfusionsInRange,
        positivity,
        bloodbagStatusPie,
        ongoingCamps,
        overview,
      },
    });
  } catch (err) {
    next(err);
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
    const total = await DonorModel.countDocuments({ deletedAt: null });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await DonorModel.countDocuments({ createdAt: { $gte: startOfMonth }, deletedAt: null });

    const active = await DonorModel.countDocuments({ eligibilityStatus: 'eligible', deletedAt: null });

    const gender = await DonorModel.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$sex', count: { $sum: 1 } } }
    ]);

    const bloodGroupAgg = await DonorModel.aggregate([
      { $match: { deletedAt: null } },
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

    const donorsList = await DonorModel.find({ deletedAt: null })
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
    const total = await DonationModel.countDocuments({ deletedAt: null });

    const byBloodGroupAgg = await DonationModel.aggregate([
      { $match: { deletedAt: null } },
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
      { $match: { deletedAt: null } },
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
      { $match: { deletedAt: null } },
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
    const camps = await CampModel.find().lean();
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

    const donations = await DonationModel.find({ deletedAt: null })
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
    const productionAgg = await BloodUnitModel.aggregate([
      { $match: { deletedAt: null } },
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

    const units = await BloodUnitModel.find({ deletedAt: null }).lean();
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
