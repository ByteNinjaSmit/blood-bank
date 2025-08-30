const multer = require('multer');
const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
    // Log the error
    logger.error({
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    }, '[Error] Unhandled error occurred');

    // Handle Multer-specific errors
    if (err instanceof multer.MulterError) {
        // Handle file size limit error
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: "File too large. Max allowed size is 100MB.",
                extraDetails: err.message,
            });
        }

        // Other multer-specific errors
        return res.status(400).json({
            success: false,
            message: "File upload error occurred.",
            extraDetails: err.message,
        });
    }

    // Handle MongoDB/Mongoose errors
    if (err.name === 'ValidationError') {
        const validationErrors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: "Validation error",
            extraDetails: validationErrors.join(', ')
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format",
            extraDetails: err.message
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate entry",
            extraDetails: "This record already exists"
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
            extraDetails: "Please login again"
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: "Token expired",
            extraDetails: "Please login again"
        });
    }

    // Handle general errors
    const status = err.status || 500;
    const message = err.message || "Internal server error";
    const extraDetails = err.extraDetails || "An unexpected error occurred";

    // Don't expose internal errors in production
    const finalExtraDetails = process.env.NODE_ENV === 'production' 
        ? "Internal server error" 
        : extraDetails;

    return res.status(status).json({ 
        success: false,
        message, 
        extraDetails: finalExtraDetails 
    });
};

module.exports = errorMiddleware;