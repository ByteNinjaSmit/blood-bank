const express = require('express');
const router = express.Router();
const misController = require('../controllers/mis-controller');
const authMiddleware = require('../middlewares/auth-middleware');

// Protect all MIS routes
router.use(authMiddleware);

// 1. Donor MIS
router.get('/donors', misController.getDonorMIS);

// 2. Donation MIS
router.get('/donations', misController.getDonationMIS);

// 3. Camp MIS
router.get('/camps', misController.getCampMIS);

// 4. Blood Bag MIS
router.get('/bags', misController.getBloodBagMIS);

// 5. Component MIS
router.get('/components', misController.getComponentMIS);

// 6. Serology MIS
router.get('/serology', misController.getSerologyMIS);

// 7. Inventory MIS
router.get('/inventory', misController.getInventoryMIS);

// 8. Hospital Issue MIS
router.get('/issues', misController.getHospitalIssueMIS);

// 9. Discard MIS
router.get('/discards', misController.getDiscardMIS);

// 10. Regulatory MIS
router.get('/regulatory', misController.getRegulatoryMIS);

// 11. Analytics MIS
router.get('/analytics', misController.getAnalyticsMIS);

// 12. Audit MIS
router.get('/audit', misController.getAuditMIS);

// 13. Executive Dashboard
router.get('/executive', misController.getDashboardMIS);

module.exports = router;
