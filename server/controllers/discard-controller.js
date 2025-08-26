const DiscardLog = require("../models/discard-model");
const mongoose = require('mongoose');

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
                message: 'Invalid discard log ID format'
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

module.exports = {
    getList,
    getSingleDetails,
};
