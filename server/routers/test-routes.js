// routers/test-routes.js
const express = require("express");
const router = express.Router();
const {
    sendTestEmail,
    triggerNow,
    sendReport,
} = require("../controllers/test-controller");

router.post("/send-email", sendTestEmail);
router.post("/expiry/report/trigger", triggerNow);
router.post("/send-expiry-report", sendReport);

module.exports = router;
