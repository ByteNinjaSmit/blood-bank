const mongoose = require("mongoose");
const Donor = require("../models/donor-model");
const BloodBag = require("../models/bloodbag-model");
const Component = require("../models/component-model");
const Inventory = require("../models/inventory-model");
const HospitalRequest = require("../models/hospital-request-model");
const Transfusion = require("../models/transfusion-model");
const DiscardLog = require("../models/discard-model");
const Site = require("../models/site-model");

const toObjectId = (v) => (mongoose.Types.ObjectId.isValid(v) ? new mongoose.Types.ObjectId(v) : null);

async function getOverview(req, res, next) {
  try {
    const siteId = toObjectId(req.user?.siteId);
    const now = new Date();
    const { range, rangeDays, from, to } = req.query || {};

    const toDate = to ? new Date(to) : now;
    toDate.setHours(23, 59, 59, 999);

    let fromDate = null;
    if (from) {
      const f = new Date(from);
      f.setHours(0, 0, 0, 0);
      fromDate = f;
    } else if (typeof rangeDays !== 'undefined' && !Number.isNaN(parseInt(rangeDays, 10))) {
      const days = Math.max(1, parseInt(rangeDays, 10));
      fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (range && ['1d','2d','7d','30d'].includes(String(range).toLowerCase())) {
      const map = { '1d': 1, '2d': 2, '7d': 7, '30d': 30 };
      const days = map[String(range).toLowerCase()] || 30;
      fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (range && String(range).toLowerCase() === 'all') {
      fromDate = null; // no time filter
    } else {
      fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const siteMatchComponent = siteId ? { siteId } : {};
    const siteMatchBag = siteId ? { siteId } : {};
    const siteMatchHR = siteId ? { siteId } : {};
    const siteMatchTransfusion = siteId ? { siteId } : {};
    const siteMatchDiscard = siteId ? { siteId } : {};

    const [donorsTotal, donationsTotal, compInStock, compReserved, compDiscarded, issuedCountAgg] = await Promise.all([
      Donor.countDocuments({}),
      BloodBag.countDocuments(siteMatchBag),
      Component.countDocuments({ status: "in-stock", ...siteMatchComponent }),
      Component.countDocuments({ status: "reserved", ...siteMatchComponent }),
      Component.countDocuments({ status: "discarded", ...siteMatchComponent }),
      Inventory.aggregate([
        { $match: { status: "issued" } },
        { $lookup: { from: "components", localField: "componentId", foreignField: "_id", as: "component" } },
        { $unwind: "$component" },
        ...(siteId ? [{ $match: { "component.siteId": siteId } }] : []),
        { $count: "count" },
      ]),
    ]);

    const issuedTotal = issuedCountAgg?.[0]?.count || 0;

    const matchDate = (field) => (fromDate ? { [field]: { $gte: fromDate, $lte: toDate } } : {});

    const [stockByGroupAgg, stockByComponentAgg, donationsTrendAgg, issuedTrendAgg, discardedTrendAgg] = await Promise.all([
      // Stock by ABO/Rh within selected period: use Inventory (inStockDate)
      Inventory.aggregate([
        { $match: { status: "in-stock", ...matchDate('inStockDate') } },
        { $lookup: { from: "components", localField: "componentId", foreignField: "_id", as: "component" } },
        { $unwind: "$component" },
        ...(siteId ? [{ $match: { "component.siteId": siteId } }] : []),
        { $lookup: { from: "bloodbags", localField: "bagNo", foreignField: "_id", as: "bag" } },
        { $unwind: "$bag" },
        { $group: { _id: { bloodGroup: "$bag.bloodGroup", rh: "$bag.rh" }, count: { $sum: 1 } } },
      ]),
      // Stock by component type within period: use Inventory (inStockDate)
      Inventory.aggregate([
        { $match: { status: "in-stock", ...matchDate('inStockDate') } },
        { $lookup: { from: "components", localField: "componentId", foreignField: "_id", as: "component" } },
        { $unwind: "$component" },
        ...(siteId ? [{ $match: { "component.siteId": siteId } }] : []),
        { $group: { _id: "$component.componentType", count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $match: { ...matchDate('collectionDate'), ...siteMatchBag } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$collectionDate" } }, value: { $sum: 1 } } },
      ]),
      Inventory.aggregate([
        { $match: { status: "issued", ...matchDate('updatedAt') } },
        { $lookup: { from: "components", localField: "componentId", foreignField: "_id", as: "component" } },
        { $unwind: "$component" },
        ...(siteId ? [{ $match: { "component.siteId": siteId } }] : []),
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, value: { $sum: 1 } } },
      ]),
      Component.aggregate([
        { $match: { status: "discarded", ...matchDate('updatedAt'), ...siteMatchComponent } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, value: { $sum: 1 } } },
      ]),
    ]);

    const thresholdsDays = { Platelet: 1, RBC: 7, FFP: 30, Cryo: 30 };
    const nearExpiryAgg = await Component.aggregate([
      { $match: { status: "in-stock", expiryDate: { $ne: null }, ...siteMatchComponent } },
      ...(fromDate ? [{ $match: matchDate('expiryDate') }] : []),
      {
        $addFields: {
          daysToExpiry: { $ceil: { $divide: [{ $subtract: ["$expiryDate", now] }, 86400000] } },
          threshold: {
            $switch: {
              branches: [
                { case: { $eq: ["$componentType", "Platelet"] }, then: thresholdsDays.Platelet },
                { case: { $eq: ["$componentType", "RBC"] }, then: thresholdsDays.RBC },
                { case: { $eq: ["$componentType", "FFP"] }, then: thresholdsDays.FFP },
                { case: { $eq: ["$componentType", "Cryo"] }, then: thresholdsDays.Cryo },
              ],
              default: 7,
            },
          },
        },
      },
      { $match: { $expr: { $lte: ["$daysToExpiry", "$threshold"] } } },
      { $group: { _id: "$componentType", count: { $sum: 1 } } },
    ]);

    const [requestsByStatusAgg, totalUnitsRequestedAgg] = await Promise.all([
      HospitalRequest.aggregate([
        { $match: { ...siteMatchHR, ...matchDate('createdAt') } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      HospitalRequest.aggregate([
        { $match: { ...siteMatchHR, ...matchDate('createdAt') } },
        { $unwind: "$requestedComponents" },
        { $group: { _id: null, units: { $sum: "$requestedComponents.units" } } },
      ]),
    ]);

    const [transfusionsInRange, discardsAgg, positivityAgg, bloodbagStatusPieAgg, donationsInRangeAgg, issuedInRangeAgg, discardedInRangeAgg, inStockInRangeAgg, reservedInRangeAgg] = await Promise.all([
      Transfusion.countDocuments({ ...matchDate('createdAt'), ...siteMatchTransfusion }),
      DiscardLog.aggregate([
        { $match: { ...matchDate('discardedAt'), ...siteMatchDiscard } },
        { $group: { _id: "$reason", count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $match: { ...siteMatchBag } },
        { $unwind: { path: "$testResults", preserveNullAndEmptyArrays: false } },
        ...(fromDate ? [{ $match: { "testResults.testedAt": { $gte: fromDate, $lte: toDate } } }] : []),
        { $group: { _id: { test: "$testResults.test", result: "$testResults.result" }, count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $match: { ...siteMatchBag, ...(fromDate ? matchDate('collectionDate') : {}) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $match: { ...siteMatchBag, ...(fromDate ? matchDate('collectionDate') : {}) } },
        { $count: 'count' },
      ]),
      Inventory.aggregate([
        { $match: { status: 'issued', ...matchDate('updatedAt') } },
        { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
        { $unwind: '$component' },
        ...(siteId ? [{ $match: { 'component.siteId': siteId } }] : []),
        { $count: 'count' },
      ]),
      Component.aggregate([
        { $match: { status: 'discarded', ...matchDate('updatedAt'), ...siteMatchComponent } },
        { $count: 'count' },
      ]),
      // In-stock added within period
      Inventory.aggregate([
        { $match: { status: 'in-stock', ...matchDate('inStockDate') } },
        { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
        { $unwind: '$component' },
        ...(siteId ? [{ $match: { 'component.siteId': siteId } }] : []),
        { $count: 'count' },
      ]),
      // Reserved within period (status updated)
      Inventory.aggregate([
        { $match: { status: 'reserved', ...matchDate('updatedAt') } },
        { $lookup: { from: 'components', localField: 'componentId', foreignField: '_id', as: 'component' } },
        { $unwind: '$component' },
        ...(siteId ? [{ $match: { 'component.siteId': siteId } }] : []),
        { $count: 'count' },
      ]),
    ]);

    const startForSeries = fromDate || new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const daysBetween = Math.max(1, Math.ceil((toDate - startForSeries) / 86400000));
    const dateRange = Array.from({ length: daysBetween }, (_, i) => {
      const d = new Date(startForSeries.getTime() + i * 86400000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    });

    const toSeries = (agg) => {
      const map = new Map(agg.map((x) => [x._id, x.value]));
      return dateRange.map((d) => ({ date: d, value: map.get(d) || 0 }));
    };

    const donationsTrend = toSeries(donationsTrendAgg);
    const issuedTrend = toSeries(issuedTrendAgg);
    const discardedTrend = toSeries(discardedTrendAgg);

    const stockByGroup = stockByGroupAgg.map((x) => ({ bloodGroup: x._id?.bloodGroup || "Unknown", rh: x._id?.rh || "Unknown", value: x.count }));
    const stockByComponent = stockByComponentAgg.map((x) => ({ componentType: x._id, value: x.count }));
    const nearExpiryByComponent = nearExpiryAgg.map((x) => ({ componentType: x._id, value: x.count }));
    const requestsByStatus = requestsByStatusAgg.map((x) => ({ status: x._id, value: x.count }));
    const totalUnitsRequested = totalUnitsRequestedAgg?.[0]?.units || 0;

    const positivity = positivityAgg.reduce((acc, x) => {
      const key = x._id?.test || "Unknown";
      acc[key] = acc[key] || { Positive: 0, Negative: 0, Indeterminate: 0 };
      const r = x._id?.result || "Unknown";
      if (acc[key][r] !== undefined) acc[key][r] += x.count;
      return acc;
    }, {});

    const bloodbagStatusPie = bloodbagStatusPieAgg.map((x) => ({ status: x._id || 'unknown', value: x.count }));
    const donationsInRange = donationsInRangeAgg?.[0]?.count || 0; // number of donations in range
    const issuedInRange = issuedInRangeAgg?.[0]?.count || 0;
    const discardedInRange = discardedInRangeAgg?.[0]?.count || 0;
    const inStockInRange = inStockInRangeAgg?.[0]?.count || 0;
    const reservedInRange = reservedInRangeAgg?.[0]?.count || 0;
    const nearExpiryTotal = nearExpiryAgg.reduce((s, x) => s + (x.count || 0), 0);

    // Donors created within period (no site field on Donor)
    const donorsFiltered = await Donor.countDocuments({ ...(fromDate ? matchDate('createdAt') : {}) });

    // ==============================
    // Rich KPI Overview Computations
    // ==============================
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime());
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      maleDonors,
      femaleDonors,
      otherDonors,
      firstTimeDonors,
      repeatDonors,
      componentsProducedAgg,
      campsConducted,
      campAgg,
      expiringToday,
      testsPending,
      delayedTesting,
      missingExpiry,
      inactiveDonors,
    ] = await Promise.all([
      Donor.countDocuments({ sex: "M" }),
      Donor.countDocuments({ sex: "F" }),
      Donor.countDocuments({ sex: "O" }),
      Donor.countDocuments({ "donationHistory.0": { $exists: true }, "donationHistory.1": { $exists: false } }),
      Donor.countDocuments({ "donationHistory.1": { $exists: true } }),
      Component.aggregate([
        { $match: { ...siteMatchComponent, ...(fromDate ? matchDate("createdAt") : {}) } },
        { $group: { _id: "$componentType", count: { $sum: 1 } } },
      ]),
      Site.countDocuments(fromDate ? { dateFrom: { $gte: fromDate, $lte: toDate } } : {}),
      BloodBag.aggregate([
        {
          $match: {
            ...siteMatchBag,
            siteId: { $ne: null },
            ...(fromDate ? matchDate("collectionDate") : {}),
          },
        },
        {
          $facet: {
            donors: [
              { $group: { _id: "$donor" } },
              { $count: "count" },
            ],
            collections: [{ $count: "count" }],
            failures: [
              { $unwind: "$testResults" },
              { $match: { "testResults.result": "Positive" } },
              { $count: "count" },
            ],
          },
        },
      ]),
      Component.countDocuments({
        status: "in-stock",
        expiryDate: { $gte: startOfToday, $lt: startOfTomorrow },
        ...siteMatchComponent,
      }),
      BloodBag.countDocuments({
        status: "testing",
        ...siteMatchBag,
      }),
      BloodBag.countDocuments({
        status: "testing",
        collectionDate: { $lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        ...siteMatchBag,
      }),
      Component.countDocuments({
        $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }],
        ...siteMatchComponent,
      }),
      Donor.countDocuments({
        $or: [
          { lastDonationDate: { $lt: sixMonthsAgo } },
          { lastDonationDate: { $exists: false } },
        ],
      }),
    ]);

    const componentsProducedTotal = (componentsProducedAgg || []).reduce((sum, x) => sum + (x.count || 0), 0);
    const componentProducedMap = (componentsProducedAgg || []).reduce((acc, x) => {
      acc[x._id] = x.count || 0;
      return acc;
    }, {});

    const campFacet = Array.isArray(campAgg) && campAgg.length > 0 ? campAgg[0] : {};
    const campDonors = campFacet.donors?.[0]?.count || 0;
    const campCollections = campFacet.collections?.[0]?.count || 0;
    const campFailures = campFacet.failures?.[0]?.count || 0;

    const stockByGroupMap = stockByGroup.reduce((acc, x) => {
      const key = `${x.bloodGroup || "Unknown"}|${x.rh || "Unknown"}`;
      acc[key] = x.value || 0;
      return acc;
    }, {});
    const stockFor = (group, rh) => stockByGroupMap[`${group}|${rh}`] || 0;

    const componentStockMap = stockByComponent.reduce((acc, x) => {
      acc[x.componentType] = x.value || 0;
      return acc;
    }, {});

    const requestsStatusMap = requestsByStatus.reduce((acc, x) => {
      acc[x.status] = x.value || 0;
      return acc;
    }, {});
    const totalRequests = requestsByStatus.reduce((sum, x) => sum + (x.value || 0), 0);

    const testsTotal = positivityAgg.reduce((sum, x) => sum + (x.count || 0), 0);

    const overview = {
      donorDonation: {
        donors: donorsTotal,
        newDonors: donorsFiltered,
        donations: donationsInRange,
        donationsInHouse: 0, // can be refined to split by in-house vs camp
        donationsCamp: 0,
        maleDonors,
        femaleDonors,
        otherDonors,
        firstTimeDonors,
        repeatDonors,
      },
      bloodBags: {
        bagsCollected: donationsInRange,
        bagsTested: testsTotal,
        bagsPassed: bloodbagStatusPie.find((x) => x.status === "passed")?.value || 0,
        bagsFailed: bloodbagStatusPie.find((x) => x.status === "failed")?.value || 0,
        bagsPending: bloodbagStatusPie.find((x) => x.status === "testing")?.value || 0,
        bagsQuarantined: bloodbagStatusPie.find((x) => x.status === "quarantined")?.value || 0,
      },
      components: {
        componentsProduced: componentsProducedTotal,
        rbcProduced: componentProducedMap.RBC || 0,
        pltProduced: componentProducedMap.Platelet || 0,
        ffpProduced: componentProducedMap.FFP || 0,
        cryoProduced: componentProducedMap.Cryo || 0,
      },
      inventory: {
        inStock: (componentStockMap.RBC || 0) + (componentStockMap.FFP || 0) + (componentStockMap.Platelet || 0) + (componentStockMap.Cryo || 0),
        reserved: reservedInRange,
        issued: issuedInRange,
        discarded: discardedInRange,
        nearExpiryTotal,
        expiredUnits: 0,
      },
      bloodGroups: {
        Opos: stockFor("O", "Positive"),
        Oneg: stockFor("O", "Negative"),
        Apos: stockFor("A", "Positive"),
        Aneg: stockFor("A", "Negative"),
        Bpos: stockFor("B", "Positive"),
        Bneg: stockFor("B", "Negative"),
        ABpos: stockFor("AB", "Positive"),
        ABneg: stockFor("AB", "Negative"),
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
        hivPos: (positivity.HIV && positivity.HIV.Positive) || 0,
        hbvPos: (positivity.HBsAg && positivity.HBsAg.Positive) || 0,
        hcvPos: (positivity.HCV && positivity.HCV.Positive) || 0,
        vdrlPos: (positivity.VDRL && positivity.VDRL.Positive) || 0,
        mpPos: (positivity.MP && positivity.MP.Positive) || 0,
        natPos: (positivity.NA && positivity.NA.Positive) || 0,
      },
      camps: {
        campsConducted,
        campDonors,
        campCollections,
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
        overview,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview };
