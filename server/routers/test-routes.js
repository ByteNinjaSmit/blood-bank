// routers/test-routes.js
const express = require("express");
const router = express.Router();
const {
    sendTestEmail,
    triggerNow,
    sendReport,
    sendSMS,
    sendSMSTwillo
} = require("../controllers/test-controller");

router.post("/send-email", sendTestEmail);
router.post("/expiry/report/trigger", triggerNow);
router.post("/send-expiry-report", sendReport);
router.post('/send-sms',sendSMS);
router.post('/send-sms-twillo',sendSMSTwillo);

// routes/admin.js
router.post('/auto-discard/trigger', async (req, res) => {
  const { recipients, siteId } = req.body;
  const { triggerImmediateRun } = require('../services/auto-discard-service');
  const job = await triggerImmediateRun({ recipients, siteId });
  res.json({ success: true, jobId: job.id });
});


module.exports = router;
