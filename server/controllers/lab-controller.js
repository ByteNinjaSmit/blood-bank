/*
GET /lab/queue – List donations pending testing
POST /lab/:donationId/results – Add/update test results
PUT /lab/:donationId/quarantine – Quarantine a bag
PUT /lab/:donationId/approve – Mark donation as passed
*/

const Component = require("../models/component-model");
const BloodBag = require("../models/bloodbag-model");
const Inventory = require("../models/inventory-model")
const mongoose = require("mongoose");
const logger = require("../utils/logger");
const DiscardLog = require("../models/discard-model");

// GET finalized/recorded serology results
const getSerologyResults = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { status, siteId, search, sortBy = "updatedAt", order = "desc" } = req.query;

        // Exclude statuses: collected, component-separated, testing
        const baseFilter = {
            status: { $nin: ["collected", "component-separated", "testing"] }
        };

        if (status) {
            baseFilter.status = status; // override to exact match if provided
        }
        if (siteId) {
            baseFilter.siteId = siteId;
        }
        if (search) {
            baseFilter.bagNo = { $regex: search, $options: "i" };
        }

        const sort = { [sortBy]: order === "asc" ? 1 : -1 };

        const total = await BloodBag.countDocuments(baseFilter);
        const bags = await BloodBag.find(baseFilter)
            .select(
                "bagNo segmentNo collectionDate expiryDate initialVitals bloodGroup rh status testResults siteId updatedAt"
            )
            .populate("siteId", "name")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        return res.status(200).json({
            success: true,
            message: "Serology results fetched successfully",
            data: bags,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error("Error fetching serology results", {
            error: error.message,
            stack: error.stack,
        });
        next(error);
    }
};

const getSerologyComponents = async (req, res, next) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, siteId, sortBy = "collectionDate", order = "desc" } = req.query;

        logger.info(`Fetching serology bags — Page: ${page}, Limit: ${limit}`);

        // Bags eligible for serology
        const validBagStatuses = ["component-separated", "testing", "failed"];

        const filter = { status: { $in: validBagStatuses } };
        if (siteId) filter.siteId = siteId;
        if (search) filter.bagNo = { $regex: search, $options: "i" };

        const sort = { [sortBy]: order === "asc" ? 1 : -1 };

        // Count total bags
        const total = await BloodBag.countDocuments(filter);

        // Fetch bags
        const bags = await BloodBag.find(filter)
            .select(
                "bagNo segmentNo collectionDate expiryDate initialVitals bloodGroup rh status testResults siteId"
            )
            .populate("siteId", "name")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        logger.info(`Fetched ${bags.length} bags for serology testing`);

        return res.status(200).json({
            success: true,
            message: "Serology bags fetched successfully",
            data: bags,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        logger.error("Error fetching serology bags", {
            error: error.message,
            stack: error.stack
        });
        next(error);
    }
};

/**
 * Update serology test results for a BloodBag.
 * Component test results are removed from model.
 * Bag decides all components' future.
 */
const updateSerologyResults = async (req, res, next) => {
    const session = await BloodBag.startSession();
    session.startTransaction();

    try {
        const { bagId } = req.params;
        const { testResults, technicianId, siteId, updatedBy } = req.body;

        // VALIDATION
        if (!bagId) throw new Error("Bag ID is required.");
        if (!Array.isArray(testResults) || testResults.length === 0)
            throw new Error("At least one test result is required.");
        if (!technicianId) throw new Error("Technician ID is required.");

        logger.info(`🔬 Starting serology update for bag ${bagId}`);

        // FETCH BAG
        const bag = await BloodBag.findById(bagId).session(session);
        if (!bag) throw new Error("BloodBag not found.");

        // FETCH ALL components of bag
        const components = await Component.find({ donationId: bagId }).session(session);

        if (components.length === 0)
            throw new Error("Bag has no separated components.");

        // Prevent reprocessing
        if (["passed", "discarded"].includes(bag.status)) {
            return res.status(400).json({
                success: false,
                message: "Bag already finalized; cannot modify serology results.",
            });
        }

        const now = new Date();

        // SAVE test results into BAG
        bag.testResults = testResults.map(t => ({
            test: t.test,
            result: t.result,
            testedAt: now,
            technicianId
        }));
        bag.updatedAt = now;
        bag.updatedBy = updatedBy;

        const anyPositive = testResults.some(t => t.result === "Positive");
        const allNegative = testResults.every(t => t.result === "Negative");

        let newBagStatus = "testing";

        if (anyPositive) {
            // =====================================================
            // ❌ CASE 1 — BAG POSITIVE → DISCARD BAG + ALL COMPONENTS
            // =====================================================
            newBagStatus = "discarded";

            // Update bag
            bag.status = "discarded";
            await bag.save({ session });

            // Discard all components
            await Component.updateMany(
                { donationId: bagId },
                {
                    $set: {
                        status: "discarded",
                        updatedAt: now,
                        updatedBy
                    }
                },
                { session }
            );

            // Remove from inventory
            await Inventory.deleteMany({ bagNo: bagId }).session(session);

            // Log discard event — BAG
            await DiscardLog.create([{
                itemType: "Bag",
                bagNo: bagId,
                componentId: null,
                reason: "Serology positive",
                discardedAt: now,
                siteId,
                updatedBy,
                isAutoDiscarded: false
            }], { session });

            // Log discard each component
            const childLogs = components.map(c => ({
                itemType: "Component",
                bagNo: bagId,
                componentId: c._id,
                reason: "Parent bag serology positive",
                discardedAt: now,
                siteId,
                updatedBy,
                isAutoDiscarded: false
            }));

            await DiscardLog.insertMany(childLogs, { session });

            logger.warn(`🩸 Bag ${bagId} discarded due to positive serology.`);
        }

        else if (allNegative) {
            // =====================================================
            // ✅ CASE 2 — ALL NEGATIVE → BAG PASSED → COMPONENTS IN-STOCK
            // =====================================================
            newBagStatus = "passed";

            bag.status = "passed";
            await bag.save({ session });

            // Update components to in-stock
            await Component.updateMany(
                { donationId: bagId },
                {
                    $set: {
                        status: "in-stock",
                        updatedBy,
                        updatedAt: now
                    }
                },
                { session }
            );

            // Add to inventory
            const inventoryPayload = components.map(c => ({
                componentId: c._id,
                bagNo: bagId,
                status: "in-stock",
                inStockDate: now,
                createdAt: now,
                createdBy: updatedBy
            }));

            await Inventory.insertMany(inventoryPayload, { session });

            logger.info(`🩸 Bag ${bagId} PASSED serology — components moved to inventory.`);
        }

        else {
            // =====================================================
            // ⚠️ CASE 3 — INDETERMINATE → Keep bag under testing
            // =====================================================
            newBagStatus = "testing";
            bag.status = "testing";
            await bag.save({ session });

            logger.info(`⚠️ Bag ${bagId} remains in testing due to indeterminate results.`);
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Serology results processed successfully.",
            data: {
                bagId,
                newStatus: newBagStatus
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        logger.error("❌ Serology update failed", {
            message: error.message,
            stack: error.stack,
        });

        next(error);
    }
};


module.exports = {
    getSerologyComponents,
    updateSerologyResults,
    getSerologyResults,
};
