const mongoose = require('mongoose');
const Donor = require('../models/donor-model');
const BloodBag = require('../models/bloodbag-model');
const Component = require('../models/component-model');
const Inventory = require('../models/inventory-model');
const Hospital = require('../models/hospital-model');
const HospitalRequest = require('../models/hospital-request-model');
const Site = require('../models/site-model');
const DiscardLog = require('../models/discard-model');
const Transfusion = require('../models/transfusion-model');
const AuditLog = require('../models/audit-log-model');
const User = require('../models/user-model');

// Helper: date range
function resolveDateRange({ from, to, period, days }) {
  const now = new Date();
  let toDate = to ? new Date(to) : now;
  toDate.setHours(23, 59, 59, 999);
  let fromDate = null;

  if (from) {
    fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
  } else if (typeof days !== 'undefined' && !Number.isNaN(parseInt(days, 10))) {
    const d = Math.max(1, parseInt(days, 10));
    fromDate = new Date(toDate.getTime() - d * 86400000);
  } else if (period) {
    const p = String(period).toLowerCase();
    if (['today', '1d'].includes(p)) {
      fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    } else if (p === '7d') {
      fromDate = new Date(toDate.getTime() - 7 * 86400000);
    } else if (p === '30d') {
      fromDate = new Date(toDate.getTime() - 30 * 86400000);
    } else if (p === 'month') {
      fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
    } else if (p === 'year') {
      fromDate = new Date(toDate.getFullYear(), 0, 1);
    }
  }
  return { fromDate, toDate };
}

function addDateMatch(field, fromDate, toDate) {
  if (!fromDate && !toDate) return {};
  const cond = {};
  if (fromDate) cond.$gte = fromDate;
  if (toDate) cond.$lte = toDate;
  return { [field]: cond };
}

function buildBucketsByAge() {
  const now = new Date();
  const yearMs = 365.25 * 24 * 60 * 60 * 1000;
  return {
    $switch: {
      branches: [
        {
          case: {
            $and: [
              { $gte: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 18] },
              { $lt: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 26] },
            ],
          },
          then: '18-25',
        },
        {
          case: {
            $and: [
              { $gte: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 26] },
              { $lt: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 36] },
            ],
          },
          then: '26-35',
        },
        {
          case: {
            $and: [
              { $gte: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 36] },
              { $lt: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 46] },
            ],
          },
          then: '36-45',
        },
        {
          case: {
            $and: [
              { $gte: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 46] },
              { $lt: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 61] },
            ],
          },
          then: '46-60',
        },
        {
          case: { $gte: [{ $divide: [{ $subtract: [now, '$dob'] }, yearMs] }, 60] },
          then: '60+',
        },
      ],
      default: 'unknown',
    },
  };
}

// Helper: simple CSV / Excel (HTML) export
function sendExport(res, { format, filename, columns, rows }) {
  if (!format || format === 'json') {
    return res.status(200).json({ success: true, data: { columns, rows } });
  }

  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'csv') {
    const header = columns.map((c) => '"' + (c.header || c.field) + '"').join(',');
    const body = rows
      .map((row) =>
        columns
          .map((c) => {
            const v = row[c.field];
            const s = v === null || v === undefined ? '' : String(v).replace(/"/g, '""');
            return '"' + s + '"';
          })
          .join(',')
      )
      .join('\n');
    const csv = header + '\n' + body;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.csv"`);
    return res.status(200).send(csv);
  }

  if (format === 'excel') {
    const headerCells = columns.map((c) => `<th>${c.header || c.field}</th>`).join('');
    const bodyRows = rows
      .map((row) => {
        const tds = columns
          .map((c) => {
            const v = row[c.field];
            const s = v === null || v === undefined ? '' : String(v).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<td>${s}</td>`;
          })
          .join('');
        return `<tr>${tds}</tr>`;
      })
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table border="1"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.xls"`);
    return res.status(200).send(html);
  }

  return res.status(400).json({ success: false, message: 'Unsupported export format' });
}

// A. DONOR MIS
async function getDonorMIS(req, res, next) {
  try {
    const { format, month, year } = req.query || {};
    const now = new Date();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const targetMonth = typeof month !== 'undefined' ? parseInt(month, 10) - 1 : now.getMonth();

    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const [totalDonors, newDonorsThisMonth, donorsAgg, campDonorIds] = await Promise.all([
      Donor.countDocuments({}),
      Donor.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
      Donor.aggregate([
        {
          $facet: {
            gender: [
              { $group: { _id: '$sex', count: { $sum: 1 } } },
            ],
            bloodGroup: [
              { $group: { _id: { bloodGroup: '$bloodGroup', rh: '$rh' }, count: { $sum: 1 } } },
            ],
            age: [
              { $addFields: { ageBucket: buildBucketsByAge() } },
              { $group: { _id: '$ageBucket', count: { $sum: 1 } } },
            ],
            locationCity: [
              { $group: { _id: '$address.city', count: { $sum: 1 } } },
            ],
            locationDistrict: [
              { $group: { _id: '$address.district', count: { $sum: 1 } } },
            ],
            locationState: [
              { $group: { _id: '$address.state', count: { $sum: 1 } } },
            ],
            eligibility: [
              { $group: { _id: '$eligibilityStatus', count: { $sum: 1 } } },
            ],
            repeatDonors: [
              { $match: { donationHistory: { $exists: true, $ne: [] } } },
              { $project: { donationCount: { $size: '$donationHistory' } } },
              { $group: { _id: null, repeat: { $sum: { $cond: [{ $gt: ['$donationCount', 1] }, 1, 0] } }, donorsWithHistory: { $sum: 1 } } },
            ],
          },
        },
      ]),
      Site.aggregate([
        { $project: { donorData: 1 } },
        { $unwind: '$donorData' },
        { $group: { _id: null, donorIds: { $addToSet: '$donorData' } } },
      ]),
    ]);

    const genderDist = (donorsAgg?.[0]?.gender || []).map((x) => ({ sex: x._id || 'Unknown', count: x.count }));
    const bloodGroupDist = (donorsAgg?.[0]?.bloodGroup || []).map((x) => ({ bloodGroup: x._id?.bloodGroup || 'Unknown', rh: x._id?.rh || 'Unknown', count: x.count }));
    const ageDist = (donorsAgg?.[0]?.age || []).map((x) => ({ bucket: x._id || 'unknown', count: x.count }));
    const cityDist = (donorsAgg?.[0]?.locationCity || []).map((x) => ({ city: x._id || 'Unknown', count: x.count }));
    const districtDist = (donorsAgg?.[0]?.locationDistrict || []).map((x) => ({ district: x._id || 'Unknown', count: x.count }));
    const stateDist = (donorsAgg?.[0]?.locationState || []).map((x) => ({ state: x._id || 'Unknown', count: x.count }));
    const eligibilityDist = (donorsAgg?.[0]?.eligibility || []).map((x) => ({ status: x._id || 'unknown', count: x.count }));
    const repeatInfo = donorsAgg?.[0]?.repeatDonors?.[0] || { repeat: 0, donorsWithHistory: 0 };

    const repeatDonors = repeatInfo.repeat || 0;

    const campIds = campDonorIds?.[0]?.donorIds || [];
    const campCount = campIds.length;
    const inHouseCount = totalDonors - campCount;

    const ageBucketsForMonth = await Donor.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $addFields: { ageBucket: buildBucketsByAge() } },
      { $group: { _id: '$ageBucket', count: { $sum: 1 } } },
    ]);

    const rhWiseMonth = await Donor.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: '$rh', count: { $sum: 1 } } },
    ]);

    const bloodGroupMonth = await Donor.aggregate([
      { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
    ]);

    const maleMonth = await Donor.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd }, sex: 'M' });
    const femaleMonth = await Donor.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd }, sex: 'F' });

    const firstTimeDonorsMonth = await Donor.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd }, donationHistory: { $size: 0 } });
    const totalMonthDonors = await Donor.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } });

    const donorSummary = {
      totalDonors,
      newDonorsThisMonth: newDonorsThisMonth,
      repeatDonors,
      genderDistribution: genderDist,
      ageDistribution: ageDist,
      bloodGroupDistribution: bloodGroupDist,
      rhDistribution: bloodGroupDist.reduce((acc, x) => {
        const key = x.rh || 'Unknown';
        const existing = acc.find((r) => r.rh === key);
        if (existing) existing.count += x.count; else acc.push({ rh: key, count: x.count });
        return acc;
      }, []),
      location: {
        city: cityDist,
        district: districtDist,
        state: stateDist,
      },
      eligibility: eligibilityDist,
      inHouseDonors: inHouseCount,
      campDonors: campCount,
    };

    const donorMonthly = {
      period: { year: targetYear, month: targetMonth + 1 },
      totalDonors: totalMonthDonors,
      maleDonors: maleMonth,
      femaleDonors: femaleMonth,
      inHouseDonors: inHouseCount,
      campDonors: campCount,
      rhWise: rhWiseMonth.map((x) => ({ rh: x._id || 'Unknown', count: x.count })),
      bloodGroupWise: bloodGroupMonth.map((x) => ({ bloodGroup: x._id || 'Unknown', count: x.count })),
      ageBuckets: ageBucketsForMonth.map((x) => ({ bucket: x._id || 'unknown', count: x.count })),
      firstTimeDonorPercent: totalMonthDonors > 0 ? Math.round((firstTimeDonorsMonth / totalMonthDonors) * 10000) / 100 : 0,
    };

    if (!format || format === 'json') {
      return res.status(200).json({ success: true, data: { summary: donorSummary, monthly: donorMonthly } });
    }

    const rows = [
      {
        totalDonors: donorSummary.totalDonors,
        newDonorsThisMonth: donorSummary.newDonorsThisMonth,
        repeatDonors: donorSummary.repeatDonors,
        inHouseDonors: donorSummary.inHouseDonors,
        campDonors: donorSummary.campDonors,
        firstTimeDonorPercent: donorMonthly.firstTimeDonorPercent,
      },
    ];

    const columns = [
      { field: 'totalDonors', header: 'Total Donors' },
      { field: 'newDonorsThisMonth', header: 'New Donors This Month' },
      { field: 'repeatDonors', header: 'Repeat Donors' },
      { field: 'inHouseDonors', header: 'In-house Donors' },
      { field: 'campDonors', header: 'Camp Donors' },
      { field: 'firstTimeDonorPercent', header: 'First-time Donor %' },
    ];

    return sendExport(res, { format, filename: 'donor_mis', columns, rows });
  } catch (err) {
    next(err);
  }
}

// B. DONATION MIS
async function getDonationMIS(req, res, next) {
  try {
    const { format, from, to, period, days, siteId } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const match = addDateMatch('collectionDate', fromDate, toDate);
    const baseMatch = { ...match };

    let siteFilter = {};
    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      siteFilter = { siteId: new mongoose.Types.ObjectId(siteId) };
    }

    const noSiteCondition = { $or: [{ siteId: null }, { siteId: { $exists: false } }] };

    const [
      totalDonations,
      inHouseDonations,
      campDonations,
      donationsByDateAgg,
      bloodGroupAgg,
      rhAgg,
      genderAgg,
      siteAgg,
      hourAgg,
      dowAgg,
    ] = await Promise.all([
      BloodBag.countDocuments({ ...baseMatch, ...siteFilter }),
      BloodBag.countDocuments({ ...baseMatch, ...siteFilter, ...noSiteCondition }),
      BloodBag.countDocuments({ ...baseMatch, ...siteFilter, siteId: { $ne: null } }),
      BloodBag.aggregate([
        { $match: { ...baseMatch, ...siteFilter } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectionDate' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      BloodBag.aggregate([
        { $match: { ...baseMatch, ...siteFilter } },
        {
          $group: {
            _id: { bloodGroup: '$bloodGroup', rh: '$rh' },
            count: { $sum: 1 },
          },
        },
      ]),
      BloodBag.aggregate([
        { $match: { ...baseMatch, ...siteFilter } },
        { $group: { _id: '$rh', count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $match: { ...baseMatch, ...siteFilter } },
        {
          $lookup: {
            from: 'donors',
            localField: 'donor',
            foreignField: '_id',
            as: 'donor',
          },
        },
        { $unwind: '$donor' },
        { $group: { _id: '$donor.sex', count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $match: { ...baseMatch } },
        {
          $lookup: {
            from: 'sites',
            localField: 'siteId',
            foreignField: '_id',
            as: 'site',
          },
        },
        { $unwind: { path: '$site', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              siteId: '$siteId',
              siteName: '$site.name',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      BloodBag.aggregate([
        { $match: { ...baseMatch, ...siteFilter } },
        {
          $project: {
            hour: { $hour: '$collectionDate' },
          },
        },
        { $group: { _id: '$hour', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      BloodBag.aggregate([
        { $match: { ...baseMatch, ...siteFilter } },
        {
          $project: {
            dow: { $dayOfWeek: '$collectionDate' },
          },
        },
        { $group: { _id: '$dow', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const donationsTrend = donationsByDateAgg.map((x) => ({
      date: x._id,
      count: x.count,
    }));

    const bloodGroupDistribution = bloodGroupAgg.map((x) => ({
      bloodGroup: x._id?.bloodGroup || 'Unknown',
      rh: x._id?.rh || 'Unknown',
      count: x.count,
    }));

    const rhDistribution = rhAgg.map((x) => ({
      rh: x._id || 'Unknown',
      count: x.count,
    }));

    const genderDistribution = genderAgg.map((x) => ({
      sex: x._id || 'Unknown',
      count: x.count,
    }));

    const siteComparison = siteAgg.map((x) => ({
      siteId: x._id?.siteId || null,
      siteName: x._id?.siteName || 'In-house',
      count: x.count,
    }));

    const peakHour = hourAgg[0]
      ? { hour: hourAgg[0]._id, count: hourAgg[0].count }
      : null;
    const peakDayRaw = dowAgg[0] || null;
    const dayNames = {
      1: 'Sunday',
      2: 'Monday',
      3: 'Tuesday',
      4: 'Wednesday',
      5: 'Thursday',
      6: 'Friday',
      7: 'Saturday',
    };
    const peakDay = peakDayRaw
      ? { dayOfWeek: dayNames[peakDayRaw._id] || String(peakDayRaw._id), count: peakDayRaw.count }
      : null;

    const summary = {
      totalDonations,
      inHouseDonations,
      campDonations,
    };

    const breakdowns = {
      byBloodGroup: bloodGroupDistribution,
      byRh: rhDistribution,
      byGender: genderDistribution,
      bySite: siteComparison,
    };

    const trends = {
      daily: donationsTrend,
    };

    const peaks = {
      hourOfDay: peakHour,
      dayOfWeek: peakDay,
    };

    if (!format || format === 'json') {
      return res.status(200).json({
        success: true,
        data: {
          summary,
          breakdowns,
          trends,
          peaks,
        },
      });
    }

    const rows = [
      {
        totalDonations,
        inHouseDonations,
        campDonations,
        peakHour: peakHour ? peakHour.hour : null,
        peakDay: peakDay ? peakDay.dayOfWeek : null,
      },
    ];

    const columns = [
      { field: 'totalDonations', header: 'Total Donations' },
      { field: 'inHouseDonations', header: 'In-house Donations' },
      { field: 'campDonations', header: 'Camp Donations' },
      { field: 'peakHour', header: 'Peak Hour' },
      { field: 'peakDay', header: 'Peak Day' },
    ];

    return sendExport(res, { format, filename: 'donation_mis', columns, rows });
  } catch (err) {
    next(err);
  }
}

// C. CAMP / SITE MIS
async function getCampMIS(req, res, next) {
  try {
    const { from, to, period, days } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const dateFilter = fromDate || toDate
      ? {
          $or: [
            addDateMatch('dateFrom', fromDate, toDate),
            addDateMatch('dateTo', fromDate, toDate),
          ],
        }
      : {};

    const sitesAgg = await Site.aggregate([
      Object.keys(dateFilter).length ? { $match: dateFilter } : { $match: {} },
      {
        $lookup: {
          from: 'donors',
          localField: 'donorData',
          foreignField: '_id',
          as: 'donors',
        },
      },
      {
        $lookup: {
          from: 'bloodbags',
          localField: '_id',
          foreignField: 'siteId',
          as: 'bags',
        },
      },
      {
        $lookup: {
          from: 'discardlogs',
          localField: '_id',
          foreignField: 'siteId',
          as: 'discards',
        },
      },
      {
        $lookup: {
          from: 'components',
          localField: '_id',
          foreignField: 'siteId',
          as: 'components',
        },
      },
      {
        $project: {
          siteId: '$siteId',
          name: 1,
          description: 1,
          address: 1,
          dateFrom: 1,
          dateTo: 1,
          staffCount: { $size: { $ifNull: ['$staff', []] } },
          donorCount: { $size: { $ifNull: ['$donors', []] } },
          deferredDonors: {
            $size: {
              $filter: {
                input: { $ifNull: ['$donors', []] },
                as: 'd',
                cond: {
                  $in: ['$$d.eligibilityStatus', ['deferred', 'temp-deferred']],
                },
              },
            },
          },
          donationsCollected: { $size: { $ifNull: ['$bags', []] } },
          serologyFailures: {
            $size: {
              $filter: {
                input: { $ifNull: ['$bags', []] },
                as: 'b',
                cond: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ['$$b.testResults', []] },
                          as: 't',
                          cond: { $eq: ['$$t.result', 'Positive'] },
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
          componentsPrepared: { $size: { $ifNull: ['$components', []] } },
          wastageCount: { $size: { $ifNull: ['$discards', []] } },
        },
      },
    ]);

    const totalCamps = sitesAgg.length;
    const totalDonors = sitesAgg.reduce((s, x) => s + (x.donorCount || 0), 0);
    const totalBags = sitesAgg.reduce((s, x) => s + (x.donationsCollected || 0), 0);
    const totalComponents = sitesAgg.reduce((s, x) => s + (x.componentsPrepared || 0), 0);
    const totalWastage = sitesAgg.reduce((s, x) => s + (x.wastageCount || 0), 0);
    const totalFailures = sitesAgg.reduce((s, x) => s + (x.serologyFailures || 0), 0);

    const register = sitesAgg.map((s) => {
      const conversion = s.donorCount > 0 ? (s.donationsCollected / s.donorCount) * 100 : 0;
      const serologyFailurePercent = s.donationsCollected > 0 ? (s.serologyFailures / s.donationsCollected) * 100 : 0;
      const discardPercent = s.componentsPrepared > 0 ? (s.wastageCount / s.componentsPrepared) * 100 : 0;
      const yieldPerBag = s.donationsCollected > 0 ? s.componentsPrepared / s.donationsCollected : 0;
      return {
        _id: s._id,
        siteId: s.siteId,
        name: s.name,
        address: s.address,
        dateFrom: s.dateFrom,
        dateTo: s.dateTo,
        staffCount: s.staffCount,
        donorCount: s.donorCount,
        donationsCollected: s.donationsCollected,
        deferredDonors: s.deferredDonors,
        serologyFailures: s.serologyFailures,
        componentsPrepared: s.componentsPrepared,
        wastageCount: s.wastageCount,
        conversionPercent: Math.round(conversion * 100) / 100,
        serologyFailurePercent: Math.round(serologyFailurePercent * 100) / 100,
        discardPercent: Math.round(discardPercent * 100) / 100,
        yieldPerBag: Math.round(yieldPerBag * 100) / 100,
      };
    });

    const kpis = {
      totalCamps,
      totalDonors,
      totalBags,
      totalComponents,
      totalWastage,
      totalSerologyFailures: totalFailures,
      avgDonorsPerCamp: totalCamps > 0 ? Math.round((totalDonors / totalCamps) * 100) / 100 : 0,
      avgBagsPerCamp: totalCamps > 0 ? Math.round((totalBags / totalCamps) * 100) / 100 : 0,
      avgYieldPerBag: totalBags > 0 ? Math.round((totalComponents / totalBags) * 100) / 100 : 0,
    };

    const byBagsDesc = [...register].sort((a, b) => (b.donationsCollected || 0) - (a.donationsCollected || 0));
    const byYieldDesc = [...register].sort((a, b) => (b.yieldPerBag || 0) - (a.yieldPerBag || 0));
    const byWastageAsc = [...register].sort((a, b) => (a.wastageCount || 0) - (b.wastageCount || 0));

    const ranking = {
      topByBags: byBagsDesc.slice(0, 10),
      worstByBags: byBagsDesc.slice(-10).reverse(),
      highestYield: byYieldDesc.slice(0, 10),
      lowestWastage: byWastageAsc.slice(0, 10),
    };

    return res.status(200).json({
      success: true,
      data: {
        register,
        kpis,
        ranking,
      },
    });
  } catch (err) {
    next(err);
  }
}

// D. BLOOD BAG MIS
async function getBagMIS(req, res, next) {
  try {
    const { from, to, period, days, siteId, status } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const dateMatch = addDateMatch('collectionDate', fromDate, toDate);
    const baseMatch = { ...dateMatch };

    if (status) {
      baseMatch.status = status;
    }

    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      baseMatch.siteId = new mongoose.Types.ObjectId(siteId);
    }

    const noSiteCondition = { $or: [{ siteId: null }, { siteId: { $exists: false } }] };

    const [
      totalBags,
      inHouseBags,
      campBags,
      statusAgg,
      bloodGroupAgg,
      rhAgg,
      pendingTesting,
      passedTesting,
      failedTesting,
      quarantinedCount,
      technicianAgg,
    ] = await Promise.all([
      BloodBag.countDocuments(baseMatch),
      BloodBag.countDocuments({ ...baseMatch, ...noSiteCondition }),
      BloodBag.countDocuments({ ...baseMatch, siteId: { $ne: null } }),
      BloodBag.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { bloodGroup: '$bloodGroup', rh: '$rh' },
            count: { $sum: 1 },
          },
        },
      ]),
      BloodBag.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$rh', count: { $sum: 1 } } },
      ]),
      BloodBag.countDocuments({ ...baseMatch, status: { $in: ['component-separated', 'testing'] } }),
      BloodBag.countDocuments({ ...baseMatch, status: 'passed' }),
      BloodBag.countDocuments({ ...baseMatch, status: 'failed' }),
      BloodBag.countDocuments({ ...baseMatch, status: 'quarantined' }),
      BloodBag.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$createdBy', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            technicianId: '$_id',
            count: 1,
            name: '$user.name',
          },
        },
      ]),
    ]);

    const summary = {
      totalBags,
      inHouseBags,
      campBags,
    };

    const statusBreakdown = statusAgg.map((x) => ({ status: x._id || 'unknown', count: x.count }));
    const bloodGroupDistribution = bloodGroupAgg.map((x) => ({
      bloodGroup: x._id?.bloodGroup || 'Unknown',
      rh: x._id?.rh || 'Unknown',
      count: x.count,
    }));
    const rhDistribution = rhAgg.map((x) => ({ rh: x._id || 'Unknown', count: x.count }));

    const testing = {
      pendingTesting,
      passedTesting,
      failedTesting,
      quarantined: quarantinedCount,
    };

    const technicianWise = technicianAgg.map((t) => ({
      technicianId: t.technicianId,
      name: t.name || null,
      count: t.count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary,
        statuses: statusBreakdown,
        breakdowns: {
          byBloodGroup: bloodGroupDistribution,
          byRh: rhDistribution,
        },
        testing,
        technicianWise,
      },
    });
  } catch (err) {
    next(err);
  }
}

// E. COMPONENT MIS
async function getComponentMIS(req, res, next) {
  try {
    const { from, to, period, days, type, status, siteId } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const dateMatch = addDateMatch('createdAt', fromDate, toDate);
    const baseMatch = { ...dateMatch };

    if (type) {
      baseMatch.componentType = type;
    }

    if (status) {
      baseMatch.status = status;
    }

    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      baseMatch.siteId = new mongoose.Types.ObjectId(siteId);
    }

    const now = new Date();
    const thresholdsDays = { Platelet: 1, RBC: 7, FFP: 30, Cryo: 30 };

    const [
      totalComponents,
      inStock,
      reserved,
      issued,
      discarded,
      byTypeAgg,
      byStatusAgg,
      bySiteAgg,
      nearExpiryAgg,
    ] = await Promise.all([
      Component.countDocuments(baseMatch),
      Component.countDocuments({ ...baseMatch, status: 'in-stock' }),
      Component.countDocuments({ ...baseMatch, status: 'reserved' }),
      Component.countDocuments({ ...baseMatch, status: 'issued' }),
      Component.countDocuments({ ...baseMatch, status: 'discarded' }),
      Component.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$componentType', count: { $sum: 1 } } },
      ]),
      Component.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Component.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$siteId',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'sites',
            localField: '_id',
            foreignField: '_id',
            as: 'site',
          },
        },
        { $unwind: { path: '$site', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            siteId: '$_id',
            count: 1,
            name: '$site.name',
          },
        },
      ]),
      Component.aggregate([
        {
          $match: {
            ...baseMatch,
            status: 'in-stock',
            expiryDate: { $ne: null },
          },
        },
        {
          $addFields: {
            daysToExpiry: {
              $ceil: {
                $divide: [{ $subtract: ['$expiryDate', now] }, 86400000],
              },
            },
            threshold: {
              $switch: {
                branches: [
                  { case: { $eq: ['$componentType', 'Platelet'] }, then: thresholdsDays.Platelet },
                  { case: { $eq: ['$componentType', 'RBC'] }, then: thresholdsDays.RBC },
                  { case: { $eq: ['$componentType', 'FFP'] }, then: thresholdsDays.FFP },
                  { case: { $eq: ['$componentType', 'Cryo'] }, then: thresholdsDays.Cryo },
                ],
                default: 7,
              },
            },
          },
        },
        { $match: { $expr: { $lte: ['$daysToExpiry', '$threshold'] } } },
        { $group: { _id: '$componentType', count: { $sum: 1 } } },
      ]),
    ]);

    const summary = {
      totalComponents,
      inStock,
      reserved,
      issued,
      discarded,
    };

    const breakdowns = {
      byType: byTypeAgg.map((x) => ({ componentType: x._id || 'Unknown', count: x.count })),
      byStatus: byStatusAgg.map((x) => ({ status: x._id || 'unknown', count: x.count })),
      bySite: bySiteAgg.map((x) => ({
        siteId: x.siteId || null,
        siteName: x.name || 'In-house',
        count: x.count,
      })),
    };

    const nearExpiryByType = nearExpiryAgg.map((x) => ({
      componentType: x._id || 'Unknown',
      count: x.count,
    }));
    const nearExpiryTotal = nearExpiryByType.reduce((s, x) => s + (x.count || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        summary,
        breakdowns,
        nearExpiry: {
          total: nearExpiryTotal,
          byType: nearExpiryByType,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// F. INVENTORY MIS
async function getInventoryMIS(req, res, next) {
  try {
    const { from, to, period, days, status } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const dateMatch = addDateMatch('updatedAt', fromDate, toDate);
    const baseMatch = { ...dateMatch };

    if (status) {
      baseMatch.status = status;
    }

    const [statusAgg, byComponentAgg, byHospitalAgg] = await Promise.all([
      Inventory.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Inventory.aggregate([
        { $match: baseMatch },
        {
          $lookup: {
            from: 'components',
            localField: 'componentId',
            foreignField: '_id',
            as: 'component',
          },
        },
        { $unwind: '$component' },
        {
          $group: {
            _id: {
              componentType: '$component.componentType',
              status: '$status',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Inventory.aggregate([
        { $match: { ...baseMatch, reservedForHospital: { $ne: null } } },
        {
          $lookup: {
            from: 'hospitals',
            localField: 'reservedForHospital',
            foreignField: '_id',
            as: 'hospital',
          },
        },
        { $unwind: { path: '$hospital', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              hospitalId: '$reservedForHospital',
              name: '$hospital.name',
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const summary = {
      total: statusAgg.reduce((s, x) => s + (x.count || 0), 0),
      inStock: statusAgg.find((x) => x._id === 'in-stock')?.count || 0,
      reserved: statusAgg.find((x) => x._id === 'reserved')?.count || 0,
      issued: statusAgg.find((x) => x._id === 'issued')?.count || 0,
      discarded: statusAgg.find((x) => x._id === 'discarded')?.count || 0,
    };

    const breakdowns = {
      byStatus: statusAgg.map((x) => ({ status: x._id || 'unknown', count: x.count })),
      byComponentType: byComponentAgg.map((x) => ({
        componentType: x._id?.componentType || 'Unknown',
        status: x._id?.status || 'unknown',
        count: x.count,
      })),
      byHospitalReserved: byHospitalAgg.map((x) => ({
        hospitalId: x._id?.hospitalId || null,
        name: x._id?.name || 'Unknown',
        reservedUnits: x.count,
      })),
    };

    return res.status(200).json({
      success: true,
      data: {
        summary,
        breakdowns,
      },
    });
  } catch (err) {
    next(err);
  }
}

// G. HOSPITAL REQUEST & ISSUE MIS
async function getIssueMIS(req, res, next) {
  try {
    const { from, to, period, days, hospitalId, status } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const dateMatch = addDateMatch('requestedAt', fromDate, toDate);
    const baseMatch = { ...dateMatch };

    if (status) {
      baseMatch.status = status;
    }

    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      baseMatch.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    const [statusAgg, unitsByComponentAgg, byHospitalAgg, turnaroundAgg, totalUnitsRequestedAgg] =
      await Promise.all([
        HospitalRequest.aggregate([
          { $match: baseMatch },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        HospitalRequest.aggregate([
          { $match: baseMatch },
          { $unwind: '$requestedComponents' },
          {
            $group: {
              _id: {
                componentType: '$requestedComponents.componentType',
                bloodGroup: '$requestedComponents.bloodGroup',
                rh: '$requestedComponents.rh',
              },
              units: { $sum: '$requestedComponents.units' },
            },
          },
        ]),
        HospitalRequest.aggregate([
          { $match: baseMatch },
          {
            $group: {
              _id: '$hospitalId',
              count: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: 'hospitals',
              localField: '_id',
              foreignField: '_id',
              as: 'hospital',
            },
          },
          { $unwind: { path: '$hospital', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              hospitalId: '$_id',
              count: 1,
              name: '$hospital.name',
            },
          },
        ]),
        HospitalRequest.aggregate([
          { $match: baseMatch },
          {
            $project: {
              approvalHours: {
                $cond: [
                  {
                    $and: [
                      { $ifNull: ['$approvedAt', false] },
                      { $ifNull: ['$requestedAt', false] },
                    ],
                  },
                  {
                    $divide: [
                      { $subtract: ['$approvedAt', '$requestedAt'] },
                      3600000,
                    ],
                  },
                  null,
                ],
              },
              issueHours: {
                $cond: [
                  {
                    $and: [
                      { $ifNull: ['$issuedAt', false] },
                      { $ifNull: ['$requestedAt', false] },
                    ],
                  },
                  {
                    $divide: [
                      { $subtract: ['$issuedAt', '$requestedAt'] },
                      3600000,
                    ],
                  },
                  null,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              avgApprovalHours: { $avg: '$approvalHours' },
              avgIssueHours: { $avg: '$issueHours' },
            },
          },
        ]),
        HospitalRequest.aggregate([
          { $match: baseMatch },
          { $unwind: '$requestedComponents' },
          {
            $group: {
              _id: null,
              units: { $sum: '$requestedComponents.units' },
            },
          },
        ]),
      ]);

    const totalRequests = statusAgg.reduce((s, x) => s + (x.count || 0), 0);
    const statusBreakdown = statusAgg.map((x) => ({ status: x._id || 'unknown', count: x.count }));
    const totalUnitsRequested = totalUnitsRequestedAgg?.[0]?.units || 0;

    const hospitals = byHospitalAgg.map((x) => ({
      hospitalId: x.hospitalId || null,
      name: x.name || 'Unknown',
      count: x.count,
    }));

    const components = unitsByComponentAgg.map((x) => ({
      componentType: x._id?.componentType || 'Unknown',
      bloodGroup: x._id?.bloodGroup || 'Unknown',
      rh: x._id?.rh || 'Unknown',
      units: x.units,
    }));

    const turnaroundRaw = turnaroundAgg?.[0] || {};
    const turnaround = {
      avgApprovalHours: turnaroundRaw.avgApprovalHours
        ? Math.round(turnaroundRaw.avgApprovalHours * 100) / 100
        : 0,
      avgIssueHours: turnaroundRaw.avgIssueHours
        ? Math.round(turnaroundRaw.avgIssueHours * 100) / 100
        : 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRequests,
          totalUnitsRequested,
        },
        statuses: statusBreakdown,
        components,
        hospitals,
        turnaround,
      },
    });
  } catch (err) {
    next(err);
  }
}

// H. DISCARD & WASTAGE MIS
async function getDiscardMIS(req, res, next) {
  try {
    const { from, to, period, days, siteId } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const dateMatch = addDateMatch('discardedAt', fromDate, toDate);
    const baseMatch = { ...dateMatch };

    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      baseMatch.siteId = new mongoose.Types.ObjectId(siteId);
    }

    const [reasonAgg, typeAgg, autoAgg, byComponentAgg, bySiteAgg] = await Promise.all([
      DiscardLog.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
      ]),
      DiscardLog.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$itemType', count: { $sum: 1 } } },
      ]),
      DiscardLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$isAutoDiscarded',
            count: { $sum: 1 },
          },
        },
      ]),
      DiscardLog.aggregate([
        { $match: baseMatch },
        {
          $lookup: {
            from: 'components',
            localField: 'componentId',
            foreignField: '_id',
            as: 'component',
          },
        },
        { $unwind: { path: '$component', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$component.componentType',
            count: { $sum: 1 },
          },
        },
      ]),
      DiscardLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$siteId',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'sites',
            localField: '_id',
            foreignField: '_id',
            as: 'site',
          },
        },
        { $unwind: { path: '$site', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            siteId: '$_id',
            count: 1,
            name: '$site.name',
          },
        },
      ]),
    ]);

    const totalDiscards = reasonAgg.reduce((s, x) => s + (x.count || 0), 0);
    const bagsDiscarded = typeAgg.find((x) => x._id === 'Bag')?.count || 0;
    const componentsDiscarded = typeAgg.find((x) => x._id === 'Component')?.count || 0;
    const autoDiscards = autoAgg.find((x) => x._id === true)?.count || 0;
    const manualDiscards = autoAgg.find((x) => x._id === false)?.count || 0;

    const summary = {
      totalDiscards,
      bagsDiscarded,
      componentsDiscarded,
      autoDiscards,
      manualDiscards,
    };

    const breakdowns = {
      byReason: reasonAgg.map((x) => ({ reason: x._id || 'Unknown', count: x.count })),
      byItemType: typeAgg.map((x) => ({ itemType: x._id || 'Unknown', count: x.count })),
      byComponentType: byComponentAgg.map((x) => ({
        componentType: x._id || 'Unknown',
        count: x.count,
      })),
      bySite: bySiteAgg.map((x) => ({
        siteId: x.siteId || null,
        siteName: x.name || 'In-house',
        count: x.count,
      })),
    };

    return res.status(200).json({
      success: true,
      data: {
        summary,
        breakdowns,
      },
    });
  } catch (err) {
    next(err);
  }
}

// I. TESTING / SEROLOGY MIS
async function getTestingMIS(req, res, next) {
  try {
    const { from, to, period, days, test } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const testsMatch = {};
    if (fromDate || toDate) {
      testsMatch['testResults.testedAt'] = {};
      if (fromDate) testsMatch['testResults.testedAt'].$gte = fromDate;
      if (toDate) testsMatch['testResults.testedAt'].$lte = toDate;
    }
    if (test) {
      testsMatch['testResults.test'] = test;
    }

    const baseMatch = Object.keys(testsMatch).length ? testsMatch : {};

    const [positivityAgg, bagStatusAgg, technicianAgg, testedBagsAgg] = await Promise.all([
      BloodBag.aggregate([
        { $unwind: { path: '$testResults', preserveNullAndEmptyArrays: false } },
        { $match: baseMatch },
        {
          $group: {
            _id: {
              test: '$testResults.test',
              result: '$testResults.result',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      BloodBag.aggregate([
        { $match: addDateMatch('collectionDate', fromDate, toDate) },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $unwind: { path: '$testResults', preserveNullAndEmptyArrays: false } },
        { $match: baseMatch },
        {
          $group: {
            _id: '$testResults.technicianId',
            tests: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            technicianId: '$_id',
            tests: 1,
            name: '$user.name',
          },
        },
      ]),
      BloodBag.aggregate([
        { $unwind: { path: '$testResults', preserveNullAndEmptyArrays: false } },
        { $match: baseMatch },
        { $group: { _id: '$_id', count: { $sum: 1 } } },
      ]),
    ]);

    const positivity = positivityAgg.reduce((acc, x) => {
      const key = x._id?.test || 'Unknown';
      acc[key] = acc[key] || { Positive: 0, Negative: 0, Indeterminate: 0 };
      const r = x._id?.result || 'Unknown';
      if (acc[key][r] !== undefined) acc[key][r] += x.count;
      return acc;
    }, {});

    const totalTests = positivityAgg.reduce((s, x) => s + (x.count || 0), 0);
    let positiveTotal = 0;
    Object.values(positivity).forEach((v) => {
      positiveTotal += v.Positive || 0;
    });
    const positivityRate = totalTests > 0 ? Math.round((positiveTotal / totalTests) * 10000) / 100 : 0;

    const statusSummary = bagStatusAgg.map((x) => ({ status: x._id || 'unknown', count: x.count }));
    const technicianWise = technicianAgg.map((t) => ({
      technicianId: t.technicianId,
      name: t.name || null,
      tests: t.tests,
    }));
    const totalBagsTested = testedBagsAgg.length;

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBagsTested,
          totalTests,
          totalPositiveTests: positiveTotal,
          positivityRate,
        },
        positivity,
        statusSummary,
        technicianWise,
      },
    });
  } catch (err) {
    next(err);
  }
}

// J. EXCEPTION / AUDIT MIS
async function getExceptionMIS(req, res, next) {
  try {
    const { from, to, period, days, entityType } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const dateMatch = addDateMatch('timestamp', fromDate, toDate);
    const baseMatch = { ...dateMatch };

    if (entityType) {
      baseMatch.entityType = entityType;
    }

    const [byEntityAgg, byActionAgg, byUserAgg, bySiteAgg] = await Promise.all([
      AuditLog.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$entityType', count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate([
        { $match: baseMatch },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$performedBy',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            userId: '$_id',
            count: 1,
            name: '$user.name',
            role: '$user.role',
          },
        },
      ]),
      AuditLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$siteId',
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'sites',
            localField: '_id',
            foreignField: '_id',
            as: 'site',
          },
        },
        { $unwind: { path: '$site', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            siteId: '$_id',
            count: 1,
            name: '$site.name',
          },
        },
      ]),
    ]);

    const totalEvents = byActionAgg.reduce((s, x) => s + (x.count || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEvents,
        },
        byEntityType: byEntityAgg.map((x) => ({ entityType: x._id || 'Unknown', count: x.count })),
        byAction: byActionAgg.map((x) => ({ action: x._id || 'Unknown', count: x.count })),
        byUser: byUserAgg.map((x) => ({
          userId: x.userId || null,
          name: x.name || 'Unknown',
          role: x.role || null,
          count: x.count,
        })),
        bySite: bySiteAgg.map((x) => ({
          siteId: x.siteId || null,
          siteName: x.name || 'Unknown',
          count: x.count,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}
async function getRegulatoryMIS(req, res, next) {
  try {
    const { from, to, period, days } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const donationMatch = addDateMatch('collectionDate', fromDate, toDate);
    const discardMatch = addDateMatch('discardedAt', fromDate, toDate);
    const requestMatch = addDateMatch('requestedAt', fromDate, toDate);

    const mandatoryTests = ['HIV', 'HBsAg', 'HCV', 'VDRL', 'MP'];

    const [
      donationsTotal,
      testedBagsAgg,
      fullPanelAgg,
      positivityAgg,
      discardsAgg,
      hrStatusAgg,
      turnaroundAgg,
    ] = await Promise.all([
      BloodBag.countDocuments(donationMatch),
      BloodBag.aggregate([
        { $match: donationMatch },
        { $unwind: { path: '$testResults', preserveNullAndEmptyArrays: false } },
        {
          $match:
            fromDate || toDate
              ? { 'testResults.testedAt': { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) } }
              : {},
        },
        { $group: { _id: '$_id', count: { $sum: 1 } } },
      ]),
      BloodBag.aggregate([
        { $match: donationMatch },
        {
          $project: {
            testResults: 1,
          },
        },
        {
          $addFields: {
            presentTests: { $setUnion: ['$testResults.test', []] },
          },
        },
        {
          $addFields: {
            hasAllMandatory: { $setIsSubset: [mandatoryTests, '$presentTests'] },
          },
        },
        { $match: { hasAllMandatory: true } },
        { $count: 'count' },
      ]),
      BloodBag.aggregate([
        { $unwind: { path: '$testResults', preserveNullAndEmptyArrays: false } },
        {
          $match:
            fromDate || toDate
              ? { 'testResults.testedAt': { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) } }
              : {},
        },
        {
          $group: {
            _id: {
              test: '$testResults.test',
              result: '$testResults.result',
            },
            count: { $sum: 1 },
          },
        },
      ]),
      DiscardLog.aggregate([
        { $match: discardMatch },
        { $group: { _id: '$reason', count: { $sum: 1 } } },
      ]),
      HospitalRequest.aggregate([
        { $match: requestMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      HospitalRequest.aggregate([
        { $match: requestMatch },
        {
          $project: {
            approvalHours: {
              $cond: [
                {
                  $and: [
                    { $ifNull: ['$approvedAt', false] },
                    { $ifNull: ['$requestedAt', false] },
                  ],
                },
                {
                  $divide: [
                    { $subtract: ['$approvedAt', '$requestedAt'] },
                    3600000,
                  ],
                },
                null,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgApprovalHours: { $avg: '$approvalHours' },
          },
        },
      ]),
    ]);

    const totalBagsTested = testedBagsAgg.length;
    const fullPanelBags = fullPanelAgg?.[0]?.count || 0;
    const fullPanelPercent =
      donationsTotal > 0 ? Math.round((fullPanelBags / donationsTotal) * 10000) / 100 : 0;

    const positivity = positivityAgg.reduce((acc, x) => {
      const key = x._id?.test || 'Unknown';
      acc[key] = acc[key] || { Positive: 0, Negative: 0, Indeterminate: 0 };
      const r = x._id?.result || 'Unknown';
      if (acc[key][r] !== undefined) acc[key][r] += x.count;
      return acc;
    }, {});

    let totalTests = 0;
    let totalPositive = 0;
    Object.values(positivity).forEach((v) => {
      totalTests += (v.Positive || 0) + (v.Negative || 0) + (v.Indeterminate || 0);
      totalPositive += v.Positive || 0;
    });

    const positivityRate = totalTests > 0 ? Math.round((totalPositive / totalTests) * 10000) / 100 : 0;

    const discardReasons = discardsAgg.map((x) => ({ reason: x._id || 'Unknown', count: x.count }));
    const requestStatuses = hrStatusAgg.map((x) => ({ status: x._id || 'unknown', count: x.count }));

    const turnaroundRaw = turnaroundAgg?.[0] || {};
    const avgApprovalHours = turnaroundRaw.avgApprovalHours
      ? Math.round(turnaroundRaw.avgApprovalHours * 100) / 100
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        compliance: {
          donationsTotal,
          totalBagsTested,
          fullPanelBags,
          fullPanelPercent,
          positivityRate,
        },
        positivity,
        discardsByReason: discardReasons,
        requestsByStatus: requestStatuses,
        turnaround: {
          avgApprovalHours,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// K. EXECUTIVE MIS DASHBOARD
async function getExecutiveMIS(req, res, next) {
  try {
    const { from, to, period, days } = req.query || {};
    const { fromDate, toDate } = resolveDateRange({ from, to, period, days });

    const donorMatch = addDateMatch('createdAt', fromDate, toDate);
    const donationMatch = addDateMatch('collectionDate', fromDate, toDate);
    const componentMatch = addDateMatch('updatedAt', fromDate, toDate);
    const requestMatch = addDateMatch('requestedAt', fromDate, toDate);
    const discardMatch = addDateMatch('discardedAt', fromDate, toDate);

    const noSiteCondition = { $or: [{ siteId: null }, { siteId: { $exists: false } }] };

    const [
      donorsInPeriod,
      donationsTotal,
      donationsInHouse,
      donationsCamp,
      componentsInStock,
      componentsReserved,
      componentsIssued,
      componentsDiscarded,
      requestsTotal,
      discardsTotal,
      donationsByDateAgg,
      issuedUnitsAgg,
      positivityAgg,
    ] = await Promise.all([
      Donor.countDocuments(donorMatch),
      BloodBag.countDocuments(donationMatch),
      BloodBag.countDocuments({ ...donationMatch, ...noSiteCondition }),
      BloodBag.countDocuments({ ...donationMatch, siteId: { $ne: null } }),
      Component.countDocuments({ ...componentMatch, status: 'in-stock' }),
      Component.countDocuments({ ...componentMatch, status: 'reserved' }),
      Component.countDocuments({ ...componentMatch, status: 'issued' }),
      Component.countDocuments({ ...componentMatch, status: 'discarded' }),
      HospitalRequest.countDocuments(requestMatch),
      DiscardLog.countDocuments(discardMatch),
      BloodBag.aggregate([
        { $match: donationMatch },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectionDate' } },
            value: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Inventory.aggregate([
        { $match: { status: 'issued', ...addDateMatch('updatedAt', fromDate, toDate) } },
        { $count: 'count' },
      ]),
      BloodBag.aggregate([
        { $unwind: { path: '$testResults', preserveNullAndEmptyArrays: false } },
        {
          $match:
            fromDate || toDate
              ? { 'testResults.testedAt': { ...(fromDate ? { $gte: fromDate } : {}), ...(toDate ? { $lte: toDate } : {}) } }
              : {},
        },
        {
          $group: {
            _id: {
              test: '$testResults.test',
              result: '$testResults.result',
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const issuedUnits = issuedUnitsAgg?.[0]?.count || 0;

    const donationsTrend = donationsByDateAgg.map((x) => ({ date: x._id, value: x.value }));

    const conversions = {
      donationPerDonor: donorsInPeriod > 0 ? Math.round((donationsTotal / donorsInPeriod) * 100) / 100 : 0,
      issuePerDonation: donationsTotal > 0 ? Math.round((issuedUnits / donationsTotal) * 100) / 100 : 0,
      discardRateComponents:
        componentsInStock + componentsReserved + componentsIssued + componentsDiscarded > 0
          ? Math.round(
              (componentsDiscarded /
                (componentsInStock + componentsReserved + componentsIssued + componentsDiscarded)) *
                10000,
            ) / 100
          : 0,
      discardRateDonations:
        donationsTotal > 0 ? Math.round((discardsTotal / donationsTotal) * 10000) / 100 : 0,
    };

    const positivity = positivityAgg.reduce((acc, x) => {
      const key = x._id?.test || 'Unknown';
      acc[key] = acc[key] || { Positive: 0, Negative: 0, Indeterminate: 0 };
      const r = x._id?.result || 'Unknown';
      if (acc[key][r] !== undefined) acc[key][r] += x.count;
      return acc;
    }, {});

    let totalTests = 0;
    let totalPositive = 0;
    Object.values(positivity).forEach((v) => {
      totalTests += (v.Positive || 0) + (v.Negative || 0) + (v.Indeterminate || 0);
      totalPositive += v.Positive || 0;
    });

    const positivityRate = totalTests > 0 ? Math.round((totalPositive / totalTests) * 10000) / 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          donors: donorsInPeriod,
          donations: donationsTotal,
          inHouseDonations: donationsInHouse,
          campDonations: donationsCamp,
          componentsInStock,
          componentsReserved,
          componentsIssued,
          componentsDiscarded,
          hospitalRequests: requestsTotal,
          discards: discardsTotal,
          issuedUnits,
        },
        ratios: {
          donationPerDonor: conversions.donationPerDonor,
          issuePerDonation: conversions.issuePerDonation,
          discardRateComponents: conversions.discardRateComponents,
          discardRateDonations: conversions.discardRateDonations,
          positivityRate,
        },
        trends: {
          donationsDaily: donationsTrend,
        },
        testing: {
          positivity,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDonorMIS,
  getCampMIS,
  getDonationMIS,
  getBagMIS,
  getComponentMIS,
  getInventoryMIS,
  getIssueMIS,
  getDiscardMIS,
  getTestingMIS,
  getExceptionMIS,
  getRegulatoryMIS,
  getExecutiveMIS,
};
