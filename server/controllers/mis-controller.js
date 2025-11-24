const mongoose = require("mongoose");
const Donor = require("../models/donor-model");
const BloodBag = require("../models/bloodbag-model");
const Site = require("../models/site-model");
const Component = require("../models/component-model");
const HospitalRequest = require("../models/hospital-request-model");
const Discard = require("../models/discard-model");
const User = require("../models/user-model");

// Helper for date ranges
const getDateRange = (period) => {
    const now = new Date();
    let start = new Date();
    if (period === 'today') start.setHours(0, 0, 0, 0);
    else if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'month') start.setMonth(now.getMonth() - 1);
    else if (period === 'year') start.setFullYear(now.getFullYear() - 1);
    return { $gte: start, $lte: now };
};

// ==============================
// 1. DONOR MIS
// ==============================
exports.getDonorMIS = async (req, res) => {
    try {
        // A. Donor Master Register (Paginated)
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        const donors = await Donor.find()
            .select("-__v")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalDonors = await Donor.countDocuments();

        // B. Statistical Summary
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);

        const stats = await Donor.aggregate([
            {
                $facet: {
                    total: [{ $count: "count" }],
                    newThisMonth: [{ $match: { createdAt: { $gte: startOfMonth } } }, { $count: "count" }],
                    active: [{ $match: { lastDonationDate: { $gte: threeMonthsAgo } } }, { $count: "count" }],
                    gender: [{ $group: { _id: "$sex", count: { $sum: 1 } } }],
                    bloodGroup: [{ $group: { _id: "$bloodGroup", count: { $sum: 1 } } }],
                    rh: [{ $group: { _id: "$rh", count: { $sum: 1 } } }],
                    city: [{ $group: { _id: "$address.city", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }],
                    age: [
                        {
                            $project: {
                                age: { $dateDiff: { startDate: "$dob", endDate: "$$NOW", unit: "year" } }
                            }
                        },
                        {
                            $bucket: {
                                groupBy: "$age",
                                boundaries: [18, 26, 36, 46, 61, 100],
                                default: "Other",
                                output: { count: { $sum: 1 } }
                            }
                        }
                    ]
                }
            }
        ]);

        // Flatten stats
        const rawStats = stats[0] || {};
        const flatStats = {
            total: rawStats.total?.[0]?.count || 0,
            newThisMonth: rawStats.newThisMonth?.[0]?.count || 0,
            active: rawStats.active?.[0]?.count || 0,
            gender: rawStats.gender || [],
            bloodGroup: rawStats.bloodGroup || [],
            rh: rawStats.rh || [],
            city: rawStats.city || [],
            age: rawStats.age || []
        };

        // C. Behavioral Analysis
        const repeatDonors = await Donor.countDocuments({ "donationHistory.1": { $exists: true } });
        const topDonors = await Donor.aggregate([
            { $project: { name: 1, count: { $size: "$donationHistory" } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                register: { donors, total: totalDonors, page, pages: Math.ceil(totalDonors / limit) },
                stats: flatStats,
                behavior: {
                    repeatDonors,
                    repeatPercentage: ((repeatDonors / (totalDonors || 1)) * 100).toFixed(2),
                    topDonors
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 2. DONATION MIS
// ==============================
exports.getDonationMIS = async (req, res) => {
    try {
        // A. Collection Summary & Breakdowns
        const summary = await BloodBag.aggregate([
            {
                $lookup: { from: "donors", localField: "donor", foreignField: "_id", as: "donorInfo" }
            },
            { $unwind: "$donorInfo" },
            {
                $facet: {
                    total: [{ $count: "count" }],
                    byType: [{ $group: { _id: "$typeOfBag", count: { $sum: 1 } } }],
                    byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
                    bySite: [
                        {
                            $lookup: { from: "sites", localField: "siteId", foreignField: "_id", as: "site" }
                        },
                        { $unwind: { path: "$site", preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: { $ifNull: ["$site.name", "In-House"] },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    byBloodGroup: [{ $group: { _id: "$bloodGroup", count: { $sum: 1 } } }],
                    byRh: [{ $group: { _id: "$rh", count: { $sum: 1 } } }],
                    byGender: [{ $group: { _id: "$donorInfo.sex", count: { $sum: 1 } } }]
                }
            }
        ]);

        // B. Time Trends (Last 12 Months)
        const trends = await BloodBag.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$collectionDate" },
                        month: { $month: "$collectionDate" },
                        day: { $dayOfMonth: "$collectionDate" }
                    },
                    count: { $sum: 1 },
                    date: { $first: "$collectionDate" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
            { $limit: 30 } // Last 30 days for daily trend
        ]);

        res.json({
            success: true,
            data: {
                summary: {
                    total: summary[0].total[0]?.count || 0,
                    byType: summary[0].byType,
                    byStatus: summary[0].byStatus,
                    bySite: summary[0].bySite,
                },
                breakdowns: {
                    byBloodGroup: summary[0].byBloodGroup,
                    byRh: summary[0].byRh,
                    byGender: summary[0].byGender,
                    bySite: summary[0].bySite
                },
                trends: trends.map(t => ({ date: t.date, count: t.count }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCampMIS = async (req, res) => {
    try {
        const camps = await Site.aggregate([
            {
                $lookup: {
                    from: "bloodbags",
                    localField: "_id",
                    foreignField: "siteId",
                    as: "bags"
                }
            },
            {
                $project: {
                    name: 1,
                    address: 1,
                    dateFrom: 1,
                    dateTo: 1,
                    totalBags: { $size: "$bags" },
                    discardedBags: {
                        $size: {
                            $filter: {
                                input: "$bags",
                                as: "bag",
                                cond: { $eq: ["$$bag.status", "discarded"] }
                            }
                        }
                    },
                    serologyFailures: {
                        $size: {
                            $filter: {
                                input: "$bags",
                                as: "bag",
                                cond: { $eq: ["$$bag.status", "failed"] }
                            }
                        }
                    }
                }
            },
            { $sort: { dateFrom: -1 } }
        ]);

        res.json({ success: true, data: camps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 4. BLOOD BAG MIS
// ==============================
exports.getBloodBagMIS = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        const bags = await BloodBag.find()
            .populate("donor", "name donorId bloodGroup")
            .populate("siteId", "name")
            .sort({ collectionDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await BloodBag.countDocuments();

        const stats = await BloodBag.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                register: { bags, total, page, pages: Math.ceil(total / limit) },
                stats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 5. COMPONENT MIS
// ==============================
exports.getComponentMIS = async (req, res) => {
    try {
        // A. Production Summary
        const production = await Component.aggregate([
            {
                $group: {
                    _id: "$componentType",
                    count: { $sum: 1 },
                    avgVolume: { $avg: "$volumeMl" }
                }
            }
        ]);

        // B. Ageing Report
        const ageing = await Component.aggregate([
            {
                $match: { status: "in-stock" }
            },
            {
                $project: {
                    componentType: 1,
                    ageDays: {
                        $dateDiff: { startDate: "$createdAt", endDate: "$$NOW", unit: "day" }
                    }
                }
            },
            {
                $bucket: {
                    groupBy: "$ageDays",
                    boundaries: [0, 3, 7, 14, 35, 42, 365],
                    default: "Expired",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        // C. Status Summary
        const status = await Component.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: { production, ageing, status }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 6. SEROLOGY MIS
// ==============================
exports.getSerologyMIS = async (req, res) => {
    try {
        // A. Failure Analysis
        const failures = await BloodBag.aggregate([
            { $unwind: "$testResults" },
            { $match: { "testResults.result": "Positive" } },
            {
                $group: {
                    _id: "$testResults.test",
                    count: { $sum: 1 }
                }
            }
        ]);

        // B. Overall Pass/Fail
        const overall = await BloodBag.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            { $match: { _id: { $in: ["passed", "failed", "testing"] } } }
        ]);

        res.json({
            success: true,
            data: { failures, overall }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 7. INVENTORY MIS
// ==============================
exports.getInventoryMIS = async (req, res) => {
    try {
        // A. Stock Summary by Group & Component
        const stock = await Component.aggregate([
            { $match: { status: "in-stock" } },
            {
                $lookup: {
                    from: "bloodbags",
                    localField: "donationId",
                    foreignField: "_id",
                    as: "bag"
                }
            },
            { $unwind: "$bag" },
            {
                $group: {
                    _id: { group: "$bag.bloodGroup", rh: "$bag.rh", type: "$componentType" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.group": 1, "_id.type": 1 } }
        ]);

        res.json({ success: true, data: stock });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 8. HOSPITAL ISSUE MIS
// ==============================
exports.getHospitalIssueMIS = async (req, res) => {
    try {
        const issues = await HospitalRequest.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const hospitalWise = await HospitalRequest.aggregate([
            { $match: { status: "issued" } },
            {
                $lookup: { from: "hospitals", localField: "hospitalId", foreignField: "_id", as: "hospital" }
            },
            { $unwind: "$hospital" },
            {
                $group: {
                    _id: "$hospital.hospitalName",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({ success: true, data: { issues, hospitalWise } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 9. DISCARD MIS
// ==============================
exports.getDiscardMIS = async (req, res) => {
    try {
        const discards = await Discard.aggregate([
            {
                $group: {
                    _id: "$reason",
                    count: { $sum: 1 }
                }
            }
        ]);

        const typeWise = await Discard.aggregate([
            {
                $group: {
                    _id: "$discardType", // 'BloodBag' or 'Component'
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({ success: true, data: { discards, typeWise } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 10. REGULATORY MIS (NACO/FDA)
// ==============================
exports.getRegulatoryMIS = async (req, res) => {
    try {
        // Simplified Regulatory Data - Collection, Production, Testing, Issues, Discards
        const collection = await BloodBag.countDocuments();
        const production = await Component.countDocuments();
        const tested = await BloodBag.countDocuments({ status: { $in: ["passed", "failed"] } });
        const reactive = await BloodBag.countDocuments({ status: "failed" });
        const issued = await Component.countDocuments({ status: "issued" });
        const discarded = await Discard.countDocuments();

        res.json({
            success: true,
            data: {
                collection,
                production,
                testing: { tested, reactive, reactiveRate: ((reactive / tested) * 100).toFixed(2) },
                issued,
                discarded
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 11. ANALYTICS & FORECAST
// ==============================
exports.getAnalyticsMIS = async (req, res) => {
    try {
        // Simple forecast based on last month's average
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const donationsLastMonth = await BloodBag.countDocuments({ collectionDate: { $gte: lastMonth } });
        const issuesLastMonth = await Component.countDocuments({ updatedAt: { $gte: lastMonth }, status: "issued" });

        // Prediction for next month (simple linear projection)
        const predictedDonations = Math.round(donationsLastMonth * 1.05); // Assume 5% growth
        const predictedDemand = Math.round(issuesLastMonth * 1.05);

        res.json({
            success: true,
            data: {
                lastMonth: { donations: donationsLastMonth, issues: issuesLastMonth },
                forecast: { donations: predictedDonations, demand: predictedDemand },
                shortageRisk: predictedDemand > predictedDonations ? "High" : "Low"
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==============================
// 12. AUDIT & EXCEPTION MIS
// ==============================
exports.getAuditMIS = async (req, res) => {
    try {
        // Exceptions: Bags in 'testing' for > 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const stuckInTesting = await BloodBag.countDocuments({ status: "testing", collectionDate: { $lte: yesterday } });

        // Exceptions: Components near expiry
        const nearExpiryDate = new Date();
        nearExpiryDate.setDate(nearExpiryDate.getDate() + 3);
        const nearExpiry = await Component.countDocuments({ status: "in-stock", expiryDate: { $lte: nearExpiryDate } });

        res.json({
            success: true,
            data: {
                stuckInTesting,
                nearExpiry
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};




// ==============================
// 13. EXECUTIVE DASHBOARD
// ==============================
exports.getDashboardMIS = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // KPIs
        const donationsToday = await BloodBag.countDocuments({ collectionDate: { $gte: today } });
        const donationsMonth = await BloodBag.countDocuments({ collectionDate: { $gte: startOfMonth } });
        const issuedMonth = await Component.countDocuments({ updatedAt: { $gte: startOfMonth }, status: "issued" });
        const stock = await Component.countDocuments({ status: "in-stock" });
        const campsMonth = await Site.countDocuments({ dateFrom: { $gte: startOfMonth } });
        const discardsMonth = await Discard.countDocuments({ createdAt: { $gte: startOfMonth } });

        // Ratios (Mock calculation or real if data allows)
        const totalDonations = await BloodBag.countDocuments();
        const totalIssues = await Component.countDocuments({ status: "issued" });
        const totalDiscards = await Discard.countDocuments();

        const ratios = {
            donationPerDonor: 1.2, // Placeholder or need complex aggregation
            issuePerDonation: (totalIssues / (totalDonations || 1)).toFixed(2),
            discardRate: ((totalDiscards / (totalIssues + totalDiscards || 1)) * 100).toFixed(2)
        };

        // Trends (Last 7 days donations)
        const last7Days = new Date();
        last7Days.setDate(today.getDate() - 6);

        const trends = await BloodBag.aggregate([
            { $match: { collectionDate: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$collectionDate" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: {
                kpis: {
                    donationsToday,
                    donationsMonth,
                    issuedMonth,
                    stock,
                    campsMonth,
                    discardsMonth
                },
                ratios,
                trends: trends.map(t => ({ date: t._id, value: t.count }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
