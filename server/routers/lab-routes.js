/*
GET    /lab/queue                → List donations pending testing
POST   /lab/:donationId/results  → Add/update test results
PUT    /lab/:donationId/quarantine → Quarantine bag
PUT    /lab/:donationId/approve  → Approve donation as safe
 */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware');

const labController = require('../controllers/lab-controller');

router.route('/bags').get(authMiddleware, labController.getSerologyComponents);
router.route('/results').get(authMiddleware, labController.getSerologyResults);
router.route('/results/:bagId').post(authMiddleware, labController.updateSerologyResults);

module.exports = router;
