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
        // Get pagination params with defaults
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        logger.info(`Fetching serology components — Page: ${page}, Limit: ${limit}`);

        // Step 1: Count total components under serology testing
        const total = await Component.countDocuments({ status: 'lab-testing' });

        logger.debug(`Total components under lab-testing: ${total}`);

        // Step 2: Fetch paginated components
        const components = await Component.find({ status: 'lab-testing' })
            .populate({
                path: 'bagId',
                match: { status: 'component-separated' },
                select: 'bagNo bloodGroup rh status',
            })
            .skip(skip)
            .limit(limit)
            .lean();

        // Step 3: Filter valid components (bag exists and matched)
        const validComponents = components.filter((c) => c.bagId);

        logger.info(`Fetched ${validComponents.length} valid components for serology testing`);

        // Step 4: Send response
        return res.status(200).json({
            success: true,
            message: 'Serology components fetched successfully',
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
        logger.error('Error fetching serology components', { error: error.message, stack: error.stack });
        next(error);
    }
};

module.exports = {
    getSerologyComponents,
};
