/*
GET /lab/queue – List donations pending testing
POST /lab/:donationId/results – Add/update test results
PUT /lab/:donationId/quarantine – Quarantine a bag
PUT /lab/:donationId/approve – Mark donation as passed
*/

const Component = require("../models/component-model");
const BloodBag = require("../models/bloodbag-model");
const mongoose = require("mongoose");
const logger = require("../utils/logger");

const getSerologyComponents = async (req, res, next) => {
    try {
        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        logger.info(`Fetching serology components — Page: ${page}, Limit: ${limit}`);

        // Define valid bag statuses for serology phase
        const validBagStatuses = ["component-separated", "testing", "failed"];

        // Step 1: Count total components under serology testing
        const total = await Component.countDocuments({ status: "lab-testing" });

        logger.debug(`Total components under lab-testing: ${total}`);

        // Step 2: Fetch paginated components with valid bag references
        const components = await Component.find({ status: "lab-testing" })
            .populate({
                path: "donationId", // ✅ Correct path (not bagId)
                match: { status: { $in: validBagStatuses } },
                select: "bagNo bloodGroup rh status",
            })
            .skip(skip)
            .limit(limit)
            .lean();

        // Step 3: Filter components whose bags matched
        const validComponents = components.filter((c) => c.donationId);

        logger.info(`Fetched ${validComponents.length} valid components for serology testing`);

        // Step 4: Send structured response
        return res.status(200).json({
            success: true,
            message: "Serology components fetched successfully",
            count: validComponents.length,
            components: validComponents,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error("Error fetching serology components", { error: error.message, stack: error.stack });
        next(error);
    }
};

/**
 * Update serology test results for a single component.
 * Automatically adjusts inventory and recalculates parent bag status.
 */
const updateSerologyResults = async (req, res, next) => {
    const session = await Component.startSession();
    session.startTransaction();

    try {
        const { componentId } = req.params;
        const { testResults, technicianId, siteId, updatedBy } = req.body;

        // --- Validation ---
        if (!componentId) throw new Error("Component ID is required.");
        if (!Array.isArray(testResults) || testResults.length === 0)
            throw new Error("At least one test result is required.");
        if (!technicianId) throw new Error("Technician ID is required.");

        logger.info(`🔬 Starting serology update for component ${componentId}`);

        // --- Fetch component and its bag ---
        const component = await Component.findById(componentId).session(session);
        if (!component) throw new Error("Component not found.");

        const bagId = component.donationId;
        if (!bagId) throw new Error("Component is missing parent BloodBag reference.");

        const bag = await BloodBag.findById(bagId).session(session);
        if (!bag) throw new Error("Associated BloodBag not found.");

        // --- Prevent reprocessing if already finalized ---
        if (["in-stock", "discarded", "issued"].includes(component.status)) {
            logger.warn(`Component ${componentId} already finalized; skipping update.`);
            return res.status(400).json({
                success: false,
                message: "Component already finalized; cannot modify serology results.",
            });
        }

        // --- Attach test metadata ---
        const now = new Date();
        component.testResults = testResults.map((t) => ({
            test: t.test,
            result: t.result,
            testedAt: now,
            technicianId,
        }));
        component.updatedAt = now;
        component.updatedBy = updatedBy;

        // --- Determine component-level status ---
        const anyPositive = testResults.some((t) => t.result === "Positive");
        const allNegative = testResults.every((t) => t.result === "Negative");

        if (anyPositive) {
            // ❌ Positive result → Discard
            component.status = "discarded";
            await component.save({ session });

            await DiscardLog.create(
                [
                    {
                        itemType: "Component",
                        bagNo: bagId,
                        reason: "Serology positive",
                        discardedAt: now,
                        siteId,
                        updatedBy,
                    },
                ],
                { session }
            );

            // Remove from inventory if present
            await Inventory.deleteOne({ componentId: component._id }).session(session);
            logger.warn(`Component ${componentId} discarded due to positive test.`);
        } else if (allNegative) {
            // ✅ All Negative → In Stock
            component.status = "in-stock";
            await component.save({ session });

            const existing = await Inventory.findOne({ componentId: component._id }).session(session);
            if (!existing) {
                await Inventory.create(
                    [
                        {
                            componentId: component._id,
                            bagNo: bagId,
                            status: "in-stock",
                            createdAt: now,
                        },
                    ],
                    { session }
                );
                logger.info(`Component ${componentId} added to inventory.`);
            } else {
                logger.debug(`Inventory already exists for component ${componentId}, skipping creation.`);
            }
        } else {
            // ⚠️ Indeterminate → keep under lab-testing
            component.status = "lab-testing";
            await component.save({ session });
            logger.info(`Component ${componentId} remains in lab-testing.`);
        }

        // --- Recalculate parent BloodBag status ---
        const siblingComponents = await Component.find({ donationId: bagId }).session(session);
        const siblingStatuses = siblingComponents.map((c) => c.status);

        let newBagStatus = "component-separated"; // Default fallback

        if (siblingStatuses.includes("lab-testing")) {
            newBagStatus = "testing";
        } else if (siblingStatuses.every((s) => s === "discarded")) {
            newBagStatus = "discarded";
        } else if (siblingStatuses.includes("discarded")) {
            newBagStatus = "failed";
        } else if (siblingStatuses.every((s) => ["in-stock", "issued", "reserved"].includes(s))) {
            newBagStatus = "passed";
        }

        if (bag.status !== newBagStatus) {
            await BloodBag.findByIdAndUpdate(
                bagId,
                { status: newBagStatus, updatedAt: now, updatedBy },
                { session }
            );
            logger.info(`🩸 BloodBag ${bagId} status updated → ${newBagStatus}`);
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Serology results processed successfully.",
            data: {
                component: {
                    id: component._id,
                    status: component.status,
                },
                bag: {
                    id: bag._id,
                    status: newBagStatus,
                },
            },
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
};
