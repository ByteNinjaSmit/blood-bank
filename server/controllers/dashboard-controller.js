const mongoose = require("mongoose");
const Donor = require("../models/donor-model");
const BloodBag = require("../models/bloodbag-model");
const Component = require("../models/component-model");
const Inventory = require("../models/inventory-model");
const HospitalRequest = require("../models/hospital-request-model");
const Transfusion = require("../models/transfusion-model");
const DiscardLog = require("../models/discard-model");

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
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOverview };
