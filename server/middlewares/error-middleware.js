const multer = require('multer'); // make sure you import multer

const errorMiddleware = (err, req, res, next) => {
    // Handle Multer-specific errors
    if (err instanceof multer.MulterError) {
        // Handle file size limit error
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                message: "File too large. Max allowed size is 100MB.",
                extraDetails: err.message,
            });
        }

        // Other multer-specific errors
        return res.status(400).json({
            message: "Multer error occurred during upload.",
            extraDetails: err.message,
        });
    }

    // Handle general errors, including custom file filter errors
    const status=err.status || 500;
    const message = err.message || "BACKEND ERROR";
    const extraDetails = err.extraDetails  || "Error from Backend";


    return res.status(status).json({ message, extraDetails });
};

module.exports = errorMiddleware;