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

const router = Router();

const ttiService = createTtiService({
  tti: createTtiRepo(),
  units: createUnitRepo(),
  deferrals: createDeferralRepo(),
  donations: createDonationRepo(),
});

// 1. GET /inventory
router.get('/inventory', authenticate, async (req, res, next) => {
  try {
    const { page, limit, status, componentType, siteId, search, sortBy, order } = req.query as any;

    const unitFilter: any = { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };

    if (status) {
      if (status === 'in-stock') unitFilter.status = 'RELEASED';
      else if (status === 'reserved') unitFilter.status = 'RESERVED';
      else if (status === 'issued') unitFilter.status = 'ISSUED';
    } else {
      unitFilter.status = { $in: ['RELEASED', 'RESERVED', 'ISSUED'] };
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
      unitFilter.$or = [
        { donationId: searchRegex },
        { unitId: searchRegex },
        { aboGroup: searchRegex }
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';

    const total = await BloodUnitModel.countDocuments(unitFilter);
    const units = await BloodUnitModel.find(unitFilter)
      .sort({ [sortField]: sortDir })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const data = units.map(u => {
      let legacyStatus = 'in-stock';
      if (u.status === 'RELEASED') legacyStatus = 'in-stock';
      else if (u.status === 'RESERVED') legacyStatus = 'reserved';
      else if (u.status === 'ISSUED') legacyStatus = 'issued';

      let legacyType: string = u.componentType;
      if (u.componentType === 'PRBC') legacyType = 'RBC';
      else if (u.componentType === 'PLATELET_CONCENTRATE') legacyType = 'Platelet';
      else if (u.componentType === 'CRYOPRECIPITATE') legacyType = 'Cryo';

      return {
        _id: u._id.toString(),
        bagNo: u.donationId,
        bag: {
          bagNo: u.donationId,
          bloodGroup: u.aboGroup,
          rh: u.rhFactor === 'POSITIVE' ? 'Positive' : 'Negative',
        },
        component: {
          componentType: legacyType,
          volumeMl: u.volumeMl,
          expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
        },
        status: legacyStatus,
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

// 2. GET /discard/get-list
router.get('/discard/get-list', authenticate, async (req, res, next) => {
  try {
    const { page, limit, search, itemType, fromDate, toDate, sortBy, order } = req.query as any;

    const unitFilter: any = { status: 'DISCARDED', $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      unitFilter.$or = [
        { donationId: searchRegex },
        { unitId: searchRegex }
      ];
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
    const sortField = sortBy || 'updatedAt';

    const total = await BloodUnitModel.countDocuments(unitFilter);
    const units = await BloodUnitModel.find(unitFilter)
      .sort({ [sortField]: sortDir })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const data = units.map(u => {
      let legacyType: string = u.componentType;
      if (u.componentType === 'PRBC') legacyType = 'RBC';
      else if (u.componentType === 'PLATELET_CONCENTRATE') legacyType = 'Platelet';
      else if (u.componentType === 'CRYOPRECIPITATE') legacyType = 'Cryo';

      const discardHistory = u.statusHistory?.find(h => h.to === 'DISCARDED');

      return {
        id: u._id.toString(),
        bagNo: u.donationId,
        componentId: u.unitId,
        componentType: legacyType,
        itemType: 'Component',
        reason: u.discardReason || 'QC_FAIL',
        discardedAt: discardHistory ? discardHistory.at.toISOString() : u.updatedAt.toISOString(),
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

    return {
      _id: t._id.toString(),
      bagNo: t.donationId,
      segmentNo: uList[0]?.unitDin || '',
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

    const ttiFilter: any = { releaseDecision: 'pending' };
    if (search) {
      ttiFilter.donationId = new RegExp(search, 'i');
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
    const { page, limit, search, order, fromDate, toDate } = req.query as any;

    const ttiFilter: any = { releaseDecision: { $ne: 'pending' } };
    if (search) {
      ttiFilter.donationId = new RegExp(search, 'i');
    }

    if (fromDate || toDate) {
      ttiFilter.decidedAt = {};
      if (fromDate) ttiFilter.decidedAt.$gte = new Date(fromDate);
      if (toDate) ttiFilter.decidedAt.$lte = new Date(toDate);
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

export default router;
