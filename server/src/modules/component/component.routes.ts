import { Router } from 'express';
import mongoose, { Types } from 'mongoose';
import { authenticate } from '@/shared/middlewares/authenticate';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TtiResultModel } from '@/modules/tti/tti.model';

const router = Router();

router.get('/list', authenticate, async (req, res, next) => {
  try {
    const { page, limit, type, status, expiryBefore, fromDate, toDate, search } = req.query as any;

    const unitFilter: any = { deletedAt: null, status: { $ne: 'COLLECTED' } };
    if (type) {
      if (type === 'RBC') unitFilter.componentType = 'PRBC';
      else if (type === 'Platelet') unitFilter.componentType = 'PLATELET_CONCENTRATE';
      else if (type === 'Cryo') unitFilter.componentType = 'CRYOPRECIPITATE';
      else unitFilter.componentType = type;
    }
    if (status) {
      if (status === 'in-stock') unitFilter.status = 'RELEASED';
      else if (status === 'reserved') unitFilter.status = 'RESERVED';
      else if (status === 'issued') unitFilter.status = 'ISSUED';
      else if (status === 'discarded') unitFilter.status = 'DISCARDED';
    }
    if (expiryBefore) {
      unitFilter.expiresAt = { $lte: new Date(expiryBefore) };
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      unitFilter.$or = [
        { donationId: searchRegex },
        { unitId: searchRegex },
        { aboGroup: searchRegex }
      ];
    }

    const hasUnitFilters = type || status || expiryBefore || search;
    const matchingDonationIds = hasUnitFilters 
      ? await BloodUnitModel.distinct('donationId', unitFilter)
      : [];

    const donationFilter: any = { deletedAt: null };
    if (hasUnitFilters) {
      donationFilter.donationId = { $in: matchingDonationIds };
    }
    if (fromDate || toDate) {
      donationFilter.collectedAt = {};
      if (fromDate) donationFilter.collectedAt.$gte = new Date(fromDate);
      if (toDate) donationFilter.collectedAt.$lte = new Date(toDate);
    }
    if (search && !matchingDonationIds.length && !hasUnitFilters) {
      donationFilter.donationId = new RegExp(search, 'i');
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const total = await DonationModel.countDocuments(donationFilter);
    const donations = await DonationModel.find(donationFilter)
      .sort({ collectedAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .populate('campId', 'name')
      .lean();

    const donationIds = donations.map(d => d.donationId);
    const allUnits = await BloodUnitModel.find({ 
      donationId: { $in: donationIds }, 
      deletedAt: null,
      status: { $ne: 'COLLECTED' }
    }).lean();
    const ttiResults = await TtiResultModel.find({ donationId: { $in: donationIds } }).lean();
    
    const unitsMap: Record<string, typeof allUnits> = {};
    allUnits.forEach(u => {
      if (u.donationId) {
        let arr = unitsMap[u.donationId];
        if (!arr) {
          arr = [];
          unitsMap[u.donationId] = arr;
        }
        arr.push(u);
      }
    });

    const ttiMap = new Map(ttiResults.map(t => [t.donationId, t]));

    const componentsList = donations.map(d => {
      const units = unitsMap[d.donationId] || [];
      const tti = ttiMap.get(d.donationId);

      const findComp = (types: string[]) => {
        const u = units.find(x => types.includes(x.componentType));
        if (!u) return { status: 'unprepared' };
        
        let legacyStatus = 'in-stock';
        if (u.status === 'RELEASED') legacyStatus = 'in-stock';
        else if (u.status === 'RESERVED') legacyStatus = 'reserved';
        else if (u.status === 'ISSUED') legacyStatus = 'issued';
        else if (u.status === 'DISCARDED' || u.status === 'EXPIRED') legacyStatus = 'discarded';

        return {
          status: 'prepared',
          componentStatus: legacyStatus,
          volumeMl: u.volumeMl,
          expiryDate: u.expiresAt ? u.expiresAt.toISOString() : ''
        };
      };

      const abo = tti?.aboGroupConfirmed || (units[0]?.aboGroup) || 'O';
      const rh = tti?.rhFactorConfirmed || (units[0]?.rhFactor) || 'POSITIVE';
      const bloodGroup = `${abo}${rh === 'POSITIVE' ? '+' : '-'}`;

      return {
        id: d._id.toString(),
        bagNo: d.donationId,
        bloodGroup,
        site: d.campId ? (d.campId as any).name : 'Inhouse',
        createdAt: d.createdAt ? d.createdAt.toISOString() : d.collectedAt.toISOString(),
        rbc: findComp(['PRBC', 'WHOLE_BLOOD']),
        ffp: findComp(['FFP']),
        platelet: findComp(['PLATELET_CONCENTRATE', 'SDP']),
        cryo: findComp(['CRYOPRECIPITATE'])
      };
    });

    res.json({
      success: true,
      components: componentsList,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (e) {
    next(e);
  }
});

router.get('/bags-to-separate', authenticate, async (req, res, next) => {
  try {
    const donations = await DonationModel.find({ donationType: 'WHOLE_BLOOD', deletedAt: null })
      .sort({ collectedAt: -1 })
      .lean();
    
    const donationIds = donations.map(d => d.donationId);
    const allUnits = await BloodUnitModel.find({ donationId: { $in: donationIds }, deletedAt: null }).lean();
    const ttiResults = await TtiResultModel.find({ donationId: { $in: donationIds } }).lean();
    const ttiMap = new Map(ttiResults.map(t => [t.donationId, t]));

    const unitsMap: Record<string, typeof allUnits> = {};
    allUnits.forEach(u => {
      if (u.donationId) {
        let arr = unitsMap[u.donationId];
        if (!arr) {
          arr = [];
          unitsMap[u.donationId] = arr;
        }
        arr.push(u);
      }
    });

    const bags = donations.map(d => {
      const units = unitsMap[d.donationId] || [];
      const tti = ttiMap.get(d.donationId);
      
      const hasCollectedUnits = units.some(u => u.status === 'COLLECTED');
      if (!hasCollectedUnits) {
        return null;
      }

      const abo = tti?.aboGroupConfirmed || units[0]?.aboGroup || 'O';
      const rh = tti?.rhFactorConfirmed || units[0]?.rhFactor || 'POSITIVE';

      return {
        bagNo: d.donationId,
        segmentNo: '',
        bloodGroup: abo,
        rh: rh === 'POSITIVE' ? 'Positive' : 'Negative',
        collectionDate: d.collectedAt.toISOString(),
        typeOfBag: (d as any).typeOfBag || 'SB',
        volumeGmMl: d.medicalExam?.volumeMl || 350,
        components: units.map(u => ({
          componentType: u.componentType,
          volumeMl: u.volumeMl
        }))
      };
    }).filter(Boolean);

    res.json({
      success: true,
      bags
    });
  } catch (e) {
    next(e);
  }
});

router.post('/separate', authenticate, async (req, res, next) => {
  try {
    const { donationId, componentType, volumeMl } = req.body;
    const actorId = (req.user as any)?.id;
    if (!actorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    let donation = await DonationModel.findOne({ donationId, deletedAt: null }).lean();
    if (!donation && Types.ObjectId.isValid(donationId)) {
      donation = await DonationModel.findOne({ _id: donationId, deletedAt: null }).lean();
    }
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
    const resolvedDonationId = donation.donationId;

    let mappedType: any = componentType;
    if (componentType === 'RBC') mappedType = 'PRBC';
    else if (componentType === 'Platelet') mappedType = 'PLATELET_CONCENTRATE';
    else if (componentType === 'Cryo') mappedType = 'CRYOPRECIPITATE';

    const codes: Record<string, string> = {
      WHOLE_BLOOD: 'WB',
      PRBC: 'PRBC',
      FFP: 'FFP',
      PLATELET_CONCENTRATE: 'PC',
      SDP: 'SDP',
      CRYOPRECIPITATE: 'CRYO',
    };
    const productCode = codes[mappedType] || mappedType;

    const existing = await BloodUnitModel.findOne({ donationId: resolvedDonationId, componentType: mappedType, deletedAt: null });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Component already separated' });
    }

    const SHELF_DAYS: Record<string, number> = {
      WHOLE_BLOOD: 35,
      PRBC: 42,
      FFP: 365,
      PLATELET_CONCENTRATE: 5,
      CRYOPRECIPITATE: 365,
    };
    const shelfDays = SHELF_DAYS[mappedType] || 35;
    const expiresAt = new Date(donation.collectedAt);
    expiresAt.setDate(expiresAt.getDate() + shelfDays);

    await BloodUnitModel.updateOne(
      { donationId: resolvedDonationId, componentType: 'WHOLE_BLOOD', deletedAt: null },
      { deletedAt: new Date(), deletedBy: new Types.ObjectId(actorId) }
    );

    const refUnit = await BloodUnitModel.findOne({ donationId: resolvedDonationId, deletedAt: null }).lean();
    const aboGroup = refUnit?.aboGroup || 'O';
    const rhFactor = refUnit?.rhFactor || 'POSITIVE';

    const unitCount = await BloodUnitModel.countDocuments({ donationId: resolvedDonationId });
    const unitId = `${resolvedDonationId}-${productCode}-${unitCount + 1}`;

    const newUnit = await BloodUnitModel.create({
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
        {
          to: 'COLLECTED',
          event: 'SEPARATE',
          actor: new Types.ObjectId(actorId),
          at: new Date(),
        }
      ],
      campId: donation.campId,
      createdBy: new Types.ObjectId(actorId),
      updatedBy: new Types.ObjectId(actorId)
    } as any);

    res.json({ success: true, unit: newUnit });
  } catch (e) {
    next(e);
  }
});

router.post('/separation-completed', authenticate, async (req, res, next) => {
  try {
    const { donationId, signature } = req.body;
    const actorId = (req.user as any)?.id;
    if (!actorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const actor = new Types.ObjectId(actorId);

    let donation = await DonationModel.findOne({ donationId, deletedAt: null }).lean();
    if (!donation && Types.ObjectId.isValid(donationId)) {
      donation = await DonationModel.findOne({ _id: donationId, deletedAt: null }).lean();
    }
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
    const resolvedDonationId = donation.donationId;
    
    await BloodUnitModel.updateMany(
      { donationId: resolvedDonationId, status: 'COLLECTED', deletedAt: null },
      {
        status: 'QUARANTINE',
        updatedBy: actor,
        $push: {
          statusHistory: {
            from: 'COLLECTED',
            to: 'QUARANTINE',
            event: 'SEPARATION_COMPLETE',
            actor,
            at: new Date(),
            reason: `Signature: ${signature}`
          }
        }
      }
    );

    res.json({ success: true, message: 'Separation completed successfully' });
  } catch (e) {
    next(e);
  }
});

router.get('/near-expiry', authenticate, async (req, res, next) => {
  try {
    const { page, limit, days, componentType, status, search } = req.query as any;

    const daysNum = parseInt(days) || 7;
    const cutoff = new Date(Date.now() + daysNum * 86_400_000);
    const unitFilter: any = {
      deletedAt: null,
      expiresAt: { $gt: new Date(), $lte: cutoff }
    };

    if (componentType) {
      if (componentType === 'RBC') unitFilter.componentType = 'PRBC';
      else if (componentType === 'Platelet') unitFilter.componentType = 'PLATELET_CONCENTRATE';
      else if (componentType === 'Cryo') unitFilter.componentType = 'CRYOPRECIPITATE';
      else unitFilter.componentType = componentType;
    }

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
        { aboGroup: searchRegex }
      ];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skipNum = (pageNum - 1) * limitNum;

    const total = await BloodUnitModel.countDocuments(unitFilter);
    const units = await BloodUnitModel.find(unitFilter)
      .sort({ expiresAt: 1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const components = units.map(u => {
      let legacyStatus = 'in-stock';
      if (u.status === 'RELEASED') legacyStatus = 'in-stock';
      else if (u.status === 'RESERVED') legacyStatus = 'reserved';
      else if (u.status === 'ISSUED') legacyStatus = 'issued';
      else if (u.status === 'DISCARDED' || u.status === 'EXPIRED') legacyStatus = 'discarded';

      let legacyType: string = u.componentType;
      if (u.componentType === 'PRBC') legacyType = 'RBC';
      else if (u.componentType === 'PLATELET_CONCENTRATE') legacyType = 'Platelet';
      else if (u.componentType === 'CRYOPRECIPITATE') legacyType = 'Cryo';

      return {
        id: u._id.toString(),
        componentId: u.unitId,
        type: legacyType,
        volumeMl: u.volumeMl,
        status: legacyStatus,
        expiryDate: u.expiresAt.toISOString(),
        bagNo: u.donationId,
        bloodGroup: `${u.aboGroup}${u.rhFactor === 'POSITIVE' ? '+' : '-'}`
      };
    });

    res.json({
      success: true,
      components,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const id = req.params['id'] as string;

    let donationDoc: any = null;
    if (id && Types.ObjectId.isValid(id)) {
      donationDoc = await DonationModel.findById(id).populate('campId', 'name').lean();
      if (!donationDoc) {
        const unitDoc = await BloodUnitModel.findById(id).lean();
        if (unitDoc) {
          donationDoc = await DonationModel.findOne({ donationId: unitDoc.donationId, deletedAt: null })
            .populate('campId', 'name')
            .lean();
        }
      }
    }

    if (!donationDoc) {
      return res.status(404).json({ success: false, message: 'Component group details not found' });
    }

    const units = await BloodUnitModel.find({ donationId: donationDoc.donationId, deletedAt: null }).lean();
    const tti = await TtiResultModel.findOne({ donationId: donationDoc.donationId }).lean();
    const donor = await mongoose.model('Donor').findById(donationDoc.donor).lean() as any;

    const findComp = (types: string[]) => {
      const u = units.find(x => types.includes(x.componentType));
      if (!u) return { status: 'unprepared' };
      
      let legacyStatus = 'in-stock';
      if (u.status === 'RELEASED') legacyStatus = 'in-stock';
      else if (u.status === 'RESERVED') legacyStatus = 'reserved';
      else if (u.status === 'ISSUED') legacyStatus = 'issued';
      else if (u.status === 'DISCARDED' || u.status === 'EXPIRED') legacyStatus = 'discarded';

      return {
        componentId: u.unitId,
        status: legacyStatus,
        volumeMl: u.volumeMl,
        expiryDate: u.expiresAt ? u.expiresAt.toISOString() : '',
        storageLocation: 'Main Fridge',
        lotNo: u.productCode
      };
    };

    const abo = tti?.aboGroupConfirmed || units[0]?.aboGroup || 'O';
    const rh = tti?.rhFactorConfirmed || units[0]?.rhFactor || 'POSITIVE';
    const bloodGroup = `${abo}${rh === 'POSITIVE' ? '+' : '-'}`;

    const completionHistory = units[0]?.statusHistory?.find((h: any) => h.event === 'SEPARATION_COMPLETE');

    const result = {
      bloodBag: {
        bagNo: donationDoc.donationId,
        bloodGroup,
        collectionDate: donationDoc.collectedAt.toISOString(),
        status: donationDoc.donorFitness?.isFit ? 'collected' : 'rejected',
        site: donationDoc.campId ? { name: (donationDoc.campId as any).name } : { name: 'Inhouse' },
        donor: donor ? {
          name: {
            firstName: donor.name?.firstName || '',
            middleName: donor.name?.middleName || '',
            lastName: donor.name?.lastName || ''
          },
          dob: donor.dob ? donor.dob.toISOString() : '',
          sex: donor.sex,
          phone: donor.phone
        } : null,
        separationVerifiedSignature: completionHistory?.reason?.replace('Signature: ', '') || '',
        separationVerifiedAt: completionHistory?.at ? completionHistory.at.toISOString() : '',
        separationVerifiedBy: completionHistory?.actor ? await mongoose.model('User').findById(completionHistory.actor as any).select('name').lean() : null
      },
      rbc: findComp(['PRBC', 'WHOLE_BLOOD']),
      ffp: findComp(['FFP']),
      platelet: findComp(['PLATELET_CONCENTRATE', 'SDP']),
      cryo: findComp(['CRYOPRECIPITATE'])
    };

    res.json({
      success: true,
      component: result
    });
  } catch (e) {
    next(e);
  }
});

export default router;
