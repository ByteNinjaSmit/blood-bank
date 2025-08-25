const DiscardLog = require("../models/discard-model");

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

module.exports = {
    getList,
};
