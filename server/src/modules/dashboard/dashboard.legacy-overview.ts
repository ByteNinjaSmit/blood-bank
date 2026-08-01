import { CampModel } from '@/modules/camp/camp.model';
import { DonorModel } from '@/modules/donor/donor.model';
import { DonationModel } from '@/modules/donation/donation.model';
import { BloodUnitModel } from '@/modules/unit/unit.model';
import { TransfusionModel } from '@/modules/transfusion/transfusion.model';
import { BagDiscardModel } from '@/modules/bag-discard/bag-discard.model';
import { DeferralModel } from '@/modules/deferral/deferral.model';
import { RequisitionModel } from '@/modules/requisition/requisition.model';
import { TtiResultModel } from '@/modules/tti/tti.model';
import { DonorCardModel } from '@/modules/donor-card/donor-card.model';
import { IssueModel } from '@/modules/issue/issue.model';
import { BulkTransferModel } from '@/modules/bulk-transfer/bulk-transfer.model';
import { buildDateQuery } from './dashboard.types';
import type { OngoingCampDto } from './dashboard.types';

export async function legacyOverview(fromDate?: Date, toDate?: Date) {
  const now = new Date();
  const refDate = toDate || now;

  const startOfToday = new Date(refDate);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(refDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(refDate);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    donorsTotal,
    donorsNew,
    maleDonors,
    femaleDonors,
    otherDonors,
    inactiveDonors,
    donations,
    donationsInHouse,
    donationsCamp,
    componentsProducedAgg,
    campsConducted,
    expiringToday,
    testsPending,
    delayedTesting,
    missingExpiry,
    stockByGroupAgg,
    stockByComponentAgg,
    nearExpiryAgg,
    requestsByStatusAgg,
    totalUnitsRequestedAgg,
    campDonorsList,
    campDonationIds,
    transfusions,
    positivityAgg,
    bloodUnitStatusAgg,
    issuedTotal,
    discardedTotal,
    inStockTotal,
    reservedTotal,
    expiredUnitsTotal,
    bagsPassed,
    bagsFailed,
    bagsPending,
    bagsQuarantined,
    donorDonationCounts,
    loanTransfers,
  ] = await Promise.all([
    DonorModel.countDocuments({
      deletedAt: null,
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    DonorModel.countDocuments({
      deletedAt: null,
      createdAt: { $gte: thirtyDaysAgo, $lte: refDate },
    }),
    DonorModel.countDocuments({
      sex: 'M',
      deletedAt: null,
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    DonorModel.countDocuments({
      sex: 'F',
      deletedAt: null,
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    DonorModel.countDocuments({
      sex: 'O',
      deletedAt: null,
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    DonorModel.countDocuments({
      deletedAt: null,
      ...buildDateQuery('createdAt', fromDate, toDate),
      $or: [
        { lastDonationDate: { $lt: sixMonthsAgo } },
        { lastDonationDate: null },
        { lastDonationDate: { $exists: false } },
      ],
    }),
    DonationModel.countDocuments({
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    DonationModel.countDocuments({
      campId: null,
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    DonationModel.countDocuments({
      campId: { $ne: null },
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    BloodUnitModel.aggregate([
      { $match: { deletedAt: null, ...buildDateQuery('collectedAt', fromDate, toDate) } },
      { $group: { _id: '$componentType', count: { $sum: 1 } } },
    ]),
    CampModel.countDocuments(buildDateQuery('dateFrom', fromDate, toDate)),
    BloodUnitModel.countDocuments({
      status: 'RELEASED',
      expiresAt: { $gte: startOfToday, $lt: startOfTomorrow },
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    TtiResultModel.countDocuments({
      releaseDecision: 'pending',
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    TtiResultModel.countDocuments({
      releaseDecision: 'pending',
      createdAt: {
        $lte: new Date(refDate.getTime() - 24 * 60 * 60 * 1000),
        ...(fromDate ? { $gte: fromDate } : {}),
      },
    }),
    BloodUnitModel.countDocuments({
      status: 'RELEASED',
      expiresAt: null,
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    BloodUnitModel.aggregate([
      {
        $match: {
          status: 'RELEASED',
          deletedAt: null,
          ...buildDateQuery('collectedAt', fromDate, toDate),
        },
      },
      { $group: { _id: { bloodGroup: '$aboGroup', rhFactor: '$rhFactor' }, count: { $sum: 1 } } },
    ]),
    BloodUnitModel.aggregate([
      {
        $match: {
          status: 'RELEASED',
          deletedAt: null,
          ...buildDateQuery('collectedAt', fromDate, toDate),
        },
      },
      { $group: { _id: '$componentType', count: { $sum: 1 } } },
    ]),
    BloodUnitModel.aggregate([
      {
        $match: {
          status: 'RELEASED',
          expiresAt: { $ne: null },
          deletedAt: null,
          ...buildDateQuery('collectedAt', fromDate, toDate),
        },
      },
      {
        $addFields: {
          daysToExpiry: { $ceil: { $divide: [{ $subtract: ['$expiresAt', refDate] }, 86400000] } },
          threshold: {
            $switch: {
              branches: [
                { case: { $eq: ['$componentType', 'RDP'] }, then: 1 },
                { case: { $eq: ['$componentType', 'PRBC'] }, then: 7 },
                { case: { $eq: ['$componentType', 'FFP'] }, then: 30 },
                { case: { $eq: ['$componentType', 'CRYO'] }, then: 30 },
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
    ]),
    RequisitionModel.aggregate([
      { $match: { deletedAt: null, ...buildDateQuery('createdAt', fromDate, toDate) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    RequisitionModel.aggregate([
      { $match: { deletedAt: null, ...buildDateQuery('createdAt', fromDate, toDate) } },
      { $unwind: '$requestedComponents' },
      { $group: { _id: null, units: { $sum: '$requestedComponents.units' } } },
    ]),
    DonationModel.find({
      campId: { $ne: null },
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }).distinct('donor'),
    DonationModel.find({
      campId: { $ne: null },
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }).distinct('donationId'),
    TransfusionModel.countDocuments(buildDateQuery('createdAt', fromDate, toDate)),
    TtiResultModel.aggregate([
      { $match: buildDateQuery('createdAt', fromDate, toDate) },
      { $unwind: '$tests' },
      { $group: { _id: { test: '$tests.testName', result: '$tests.result' }, count: { $sum: 1 } } },
    ]),
    BloodUnitModel.aggregate([
      { $match: { deletedAt: null, ...buildDateQuery('collectedAt', fromDate, toDate) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    BloodUnitModel.countDocuments({
      status: 'ISSUED',
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    BloodUnitModel.countDocuments({
      status: 'DISCARDED',
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    BloodUnitModel.countDocuments({
      status: 'RELEASED',
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    BloodUnitModel.countDocuments({
      status: 'RESERVED',
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    BloodUnitModel.countDocuments({
      status: 'EXPIRED',
      deletedAt: null,
      ...buildDateQuery('collectedAt', fromDate, toDate),
    }),
    TtiResultModel.countDocuments({
      releaseDecision: 'released',
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    TtiResultModel.countDocuments({
      releaseDecision: 'reactive',
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    TtiResultModel.countDocuments({
      releaseDecision: 'pending',
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    TtiResultModel.countDocuments({
      releaseDecision: 'on-hold',
      ...buildDateQuery('createdAt', fromDate, toDate),
    }),
    DonationModel.aggregate([
      { $match: { deletedAt: null, ...buildDateQuery('collectedAt', fromDate, toDate) } },
      { $group: { _id: '$donor', count: { $sum: 1 } } },
    ]),
    BulkTransferModel.find({
      transferType: 'TAKE_LOAN',
      deletedAt: null,
      ...buildDateQuery('transferDate', fromDate, toDate),
    }).lean(),
  ]);

  // Bags taken on loan from other blood banks — never a BloodUnit
  // record here, so they're folded into the "in stock" totals
  // separately rather than via the BloodUnit aggregates above.
  let loanTotal = 0;
  const loanByGroup: Record<string, number> = {};
  const loanByComponent: Record<string, number> = {};
  loanTransfers.forEach((t: any) => {
    (t.items || []).forEach((it: any) => {
      loanTotal += 1;
      const rh = it.bloodGroup?.endsWith('-') ? 'Negative' : 'Positive';
      const group = (it.bloodGroup || '').replace(/[+-]/, '');
      loanByGroup[`${group}|${rh}`] = (loanByGroup[`${group}|${rh}`] || 0) + 1;
      loanByComponent[it.componentType] = (loanByComponent[it.componentType] || 0) + 1;
    });
  });

  let firstTimeDonors = 0;
  let repeatDonors = 0;
  donorDonationCounts.forEach((d: any) => {
    if (d.count === 1) firstTimeDonors++;
    else if (d.count > 1) repeatDonors++;
  });

  const componentProducedMap = componentsProducedAgg.reduce((acc: any, x: any) => {
    acc[x._id] = x.count || 0;
    return acc;
  }, {});
  const componentsProducedTotal = componentsProducedAgg.reduce(
    (s: number, x: any) => s + (x.count || 0),
    0,
  );

  const stockByGroupMap: Record<string, number> = {};
  stockByGroupAgg.forEach((x: any) => {
    const bg = x._id?.bloodGroup || 'Unknown';
    const rh = x._id?.rhFactor === 'NEGATIVE' ? 'Negative' : 'Positive';
    stockByGroupMap[`${bg}|${rh}`] = x.count || 0;
  });
  const stockFor = (group: string, rh: string) =>
    (stockByGroupMap[`${group}|${rh}`] || 0) + (loanByGroup[`${group}|${rh}`] || 0);

  const componentStockMap = stockByComponentAgg.reduce((acc: any, x: any) => {
    acc[x._id] = x.count || 0;
    return acc;
  }, {});
  Object.entries(loanByComponent).forEach(([componentType, count]) => {
    componentStockMap[componentType] = (componentStockMap[componentType] || 0) + count;
  });

  const nearExpiryByComponent = nearExpiryAgg.map((x: any) => ({
    componentType: x._id,
    value: x.count,
  }));
  const nearExpiryTotal = nearExpiryAgg.reduce((s: number, x: any) => s + (x.count || 0), 0);

  const requestsStatusMap = requestsByStatusAgg.reduce((acc: any, x: any) => {
    acc[(x._id || 'unknown').toLowerCase()] = x.count || 0;
    return acc;
  }, {});
  const totalRequests = requestsByStatusAgg.reduce((s: number, x: any) => s + (x.count || 0), 0);
  const totalUnitsRequested = totalUnitsRequestedAgg?.[0]?.units || 0;

  const campFailures = await TtiResultModel.countDocuments({
    donationId: { $in: campDonationIds },
    releaseDecision: 'reactive',
  });

  const positivity: Record<string, { Reactive: number; Negative: number; Shadeness: number }> = {};
  positivityAgg.forEach((x: any) => {
    let testKey = x._id?.test || 'Unknown';
    if (testKey === 'HBSAG') testKey = 'HBsAg';
    else if (testKey === 'SYPHILIS') testKey = 'VDRL';
    else if (testKey === 'MALARIA') testKey = 'MP';

    let resultKey = x._id?.result || 'Unknown';
    if (resultKey === 'NEGATIVE') resultKey = 'Negative';
    else if (resultKey === 'REACTIVE') resultKey = 'Reactive';
    else if (resultKey === 'INDETERMINATE') resultKey = 'Shadeness';

    if (!positivity[testKey]) positivity[testKey] = { Reactive: 0, Negative: 0, Shadeness: 0 };
    const entry = positivity[testKey];
    if (!entry) return;
    if (resultKey === 'Reactive') entry.Reactive += x.count;
    else if (resultKey === 'Negative') entry.Negative += x.count;
    else if (resultKey === 'Shadeness') entry.Shadeness += x.count;
  });
  const testsTotal = positivityAgg.reduce((s: number, x: any) => s + (x.count || 0), 0);

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
  bloodUnitStatusAgg.forEach((x: any) => {
    const status = x._id;
    if (status === 'COLLECTED') statusPieMap.collected += x.count;
    else if (status === 'IN_TESTING') statusPieMap.testing += x.count;
    else if (status === 'QUARANTINE') statusPieMap.quarantined += x.count;
    else if (['RELEASED', 'RESERVED', 'CROSSMATCHED'].includes(status))
      statusPieMap.passed += x.count;
    else if (['ISSUED', 'TRANSFUSED'].includes(status)) statusPieMap.issued += x.count;
    else if (['DISCARDED', 'EXPIRED'].includes(status)) statusPieMap.discarded += x.count;
  });
  const bloodbagStatusPie = Object.entries(statusPieMap).map(([status, value]) => ({
    status,
    value,
  }));

  const campFilter: any = {};
  if (fromDate || toDate) {
    if (fromDate) campFilter.dateTo = { $gte: fromDate };
    if (toDate) campFilter.dateFrom = { $lte: toDate };
  } else {
    campFilter.dateFrom = { $lte: refDate };
    campFilter.dateTo = { $gte: refDate };
  }
  const ongoingCampsRaw = await CampModel.find(campFilter).populate('staff', 'name').lean();
  const ongoingCamps: OngoingCampDto[] = ongoingCampsRaw.map((c: any) => ({
    id: c._id.toString(),
    campId: c.campId,
    name: c.name,
    address: c.address,
    dateFrom: c.dateFrom.toISOString(),
    dateTo: c.dateTo.toISOString(),
    staff: (c.staff || [])
      .map((s: any) => (s ? `${s.name?.first || ''} ${s.name?.last || ''}`.trim() : ''))
      .filter(Boolean),
    donorsCount: c.donorData?.length || 0,
    unitsCount: c.unitData?.length || 0,
  }));

  return {
    donorDonation: {
      donors: donorsTotal,
      newDonors: donorsNew,
      donations,
      donationsInHouse,
      donationsCamp,
      maleDonors,
      femaleDonors,
      otherDonors,
      firstTimeDonors,
      repeatDonors,
    },
    bloodBags: {
      bagsCollected: donations,
      bagsTested: testsTotal,
      bagsPassed,
      bagsFailed,
      bagsPending,
      bagsQuarantined,
    },
    components: {
      componentsProduced: componentsProducedTotal,
      rbcProduced: componentProducedMap.PRBC || 0,
      pltProduced: componentProducedMap.RDP || 0,
      ffpProduced: componentProducedMap.FFP || 0,
      cryoProduced: componentProducedMap.CRYO || 0,
      sdpProduced: componentProducedMap.SDP || 0,
    },
    inventory: {
      inStock: inStockTotal + loanTotal,
      reserved: reservedTotal,
      issued: issuedTotal,
      discarded: discardedTotal,
      nearExpiryTotal,
      expiredUnits: expiredUnitsTotal,
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
      rbcStock: componentStockMap.PRBC || 0,
      pltStock: componentStockMap.RDP || 0,
      ffpStock: componentStockMap.FFP || 0,
      cryoStock: componentStockMap.CRYO || 0,
      sdpStock: componentStockMap.SDP || 0,
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
      hivPos: positivity.HIV?.Reactive || 0,
      hbvPos: positivity.HBsAg?.Reactive || 0,
      hcvPos: positivity.HCV?.Reactive || 0,
      vdrlPos: positivity.VDRL?.Reactive || 0,
      mpPos: positivity.MP?.Reactive || 0,
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
    ongoingCamps,
    nearExpiryByComponent,
    bloodbagStatusPie,
  };
}
