const DiscardLog = require("../models/discard-model");
const BloodBag = require("../models/bloodbag-model");
const Component = require("../models/component-model");
const Inventory = require("../models/inventory-model");

const mongoose = require("mongoose");

const getList = async (req, res, next) => {
    try {
        // Default pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtering
        const filter = {};
        if (req.query.itemType) filter.itemType = req.query.itemType;
        if (req.query.siteId) filter.siteId = req.query.siteId;

        // Sorting (default: newest first)
        const sortBy = req.query.sortBy || "discardedAt";
        const order = req.query.order === "asc" ? 1 : -1;
        const sort = { [sortBy]: order };

        // Query DB
        const [total, logs] = await Promise.all([
            DiscardLog.countDocuments(filter),
            DiscardLog.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("bagNo") // Populate bag reference
                .populate("siteId"), // Populate site reference
        ]);

        // Transform logs to required format
        const formattedLogs = logs.map((log, index) => ({
            id: log._id.toString(), // or use index + 1 if you prefer
            itemType: log.itemType,
            itemId: log.bagNo?.code || "N/A", // Assume bagNo has a 'code' field like 'DON001'
            bagNo: log.bagNo?.bagNumber || "N/A", // Customize as per your schema
            reason: log.reason,
            discardedAt: log.discardedAt.toISOString().split("T")[0],
            siteId: log.siteId?.siteCode || "N/A", // Customize as per Site model
            createdAt: log.createdAt.toISOString(),
        }));

        // Response
        return res.status(200).json({
            success: true,
            data: formattedLogs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching discard logs:", error);
        next(error);
    }
};

const getSingleDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid discard log ID format",
            });
        }

        const log = await DiscardLog.findById(id)
            .populate({
                path: "bagNo",
                populate: {
                    path: "donor", // nested population
                    model: "Donor",
                },
            })
            .populate("siteId");

        if (!log) {
            return res.status(404).json({
                success: false,
                message: "Discard log not found",
            });
        }

        // Optionally format the result
        const formatted = {
            id: log._id.toString(),
            itemType: log.itemType,
            reason: log.reason,
            discardedAt: log.discardedAt,
            site: log.siteId
                ? {
                    id: log.siteId._id,
                    name: log.siteId.name || "", // adjust based on actual schema
                    code: log.siteId.code || "",
                }
                : null,
            bag: log.bagNo
                ? {
                    id: log.bagNo._id,
                    bagNo: log.bagNo.bagNo,
                    typeOfBag: log.bagNo.typeOfBag,
                    bloodGroup: log.bagNo.bloodGroup,
                    rh: log.bagNo.rh,
                    expiryDate: log.bagNo.expiryDate,
                    donor: log.bagNo.donor
                        ? {
                            id: log.bagNo.donor._id,
                            donorId: log.bagNo.donor.donorId,
                            name: `${log.bagNo.donor.name.firstName} ${log.bagNo.donor.name.lastName}`,
                            bloodGroup: log.bagNo.donor.bloodGroup,
                            rh: log.bagNo.donor.rh,
                            phone: log.bagNo.donor.phone,
                        }
                        : null,
                }
                : null,
            createdAt: log.createdAt,
        };

        return res.status(200).json({
            success: true,
            data: formatted,
        });
    } catch (error) {
        console.error("Error fetching discard log:", error);
        next(error);
    }
};

// Discard Model (Manual)
const discardItem = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { itemType, bagNo, reason, updatedBy, siteId } = req.body;

        if (!itemType || !bagNo || !updatedBy) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: itemType, bagNo, updatedBy",
            });
        }

        let discardedDoc = null;

        // ======================================
        // 🧬 CASE 1: DISCARD COMPONENT
        // ======================================
        if (itemType === "Component") {
            const component = await Component.findById(bagNo).session(session);
            if (!component) {
                await session.abortTransaction();
                return res.status(404).json({ success: false, message: "Component not found" });
            }

            // Discard component
            component.status = "discarded";
            component.updatedBy = updatedBy;
            await component.save({ session });

            // Update Inventory (if found)
            await Inventory.updateOne(
                { componentId: component._id },
                { $set: { status: "discarded" } },
                { session }
            );

            // Create discard log
            const discardLog = new DiscardLog({
                itemType: "Component",
                bagNo: component.bagId,
                reason: reason || "Manually discarded component",
                discardedAt: new Date(),
                siteId,
                updatedBy,
            });
            await discardLog.save({ session });

            discardedDoc = component;

            // Optional: If all components of the same bag are discarded, mark bag as discarded
            const remainingActive = await Component.countDocuments({
                bagId: component.bagId,
                status: { $ne: "discarded" },
            }).session(session);

            if (remainingActive === 0) {
                await BloodBag.findByIdAndUpdate(
                    component.bagId,
                    { status: "discarded", updatedBy },
                    { session }
                );
            }
        }

        // ======================================
        // 🩸 CASE 2: DISCARD BAG
        // ======================================
        else if (itemType === "Bag") {
            const bag = await BloodBag.findById(bagNo)
                .populate("components")
                .session(session);

            if (!bag) {
                await session.abortTransaction();
                return res.status(404).json({ success: false, message: "Blood Bag not found" });
            }

            // Find components with Positive test results
            const positiveComponents = await Component.find({
                _id: { $in: bag.components },
                "testResults.result": "Positive",
            }).session(session);

            if (positiveComponents.length === 0) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: "No component with positive test results — discard not required",
                });
            }

            // Discard all positive components
            const componentIds = positiveComponents.map((c) => c._id);
            await Component.updateMany(
                { _id: { $in: componentIds } },
                { $set: { status: "discarded", updatedBy } },
                { session }
            );

            // Update inventory for those components
            await Inventory.updateMany(
                { componentId: { $in: componentIds } },
                { $set: { status: "discarded" } },
                { session }
            );

            // If ALL components are positive/discarded → discard entire bag
            const totalComponents = bag.components.length;
            const discardedCount = await Component.countDocuments({
                _id: { $in: bag.components },
                status: "discarded",
            }).session(session);

            if (discardedCount === totalComponents) {
                bag.status = "discarded";
                bag.updatedBy = updatedBy;
                await bag.save({ session });
            }

            // Log discard (for bag and components)
            await DiscardLog.create(
                [
                    {
                        itemType: "Bag",
                        bagNo: bag._id,
                        reason: reason || "Positive test result — bag discarded",
                        discardedAt: new Date(),
                        siteId,
                        updatedBy,
                    },
                    ...componentIds.map((id) => ({
                        itemType: "Component",
                        bagNo: bag._id,
                        reason: "Component tested positive — discarded with bag",
                        discardedAt: new Date(),
                        siteId,
                        updatedBy,
                    })),
                ],
                { session }
            );

            discardedDoc = bag;
        }

        // ======================================
        // ❌ INVALID TYPE
        // ======================================
        else {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Invalid itemType. Must be 'Bag' or 'Component'.",
            });
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: `${itemType} discarded successfully.`,
            discardedDoc,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log(`Error from discardItem: ${error}`);
        next(error);
    }
};

module.exports = {
    getList,
    getSingleDetails,
    discardItem
};
