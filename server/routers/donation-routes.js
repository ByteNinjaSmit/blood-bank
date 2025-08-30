/*
POST   /donations                → Create donation (bagNo, segmentNo)
GET    /donations                → List donations (filters)
GET    /donations/:id            → Get donation details
PUT    /donations/:id            → Update vitals/collection info
PATCH  /donations/:id/status     → Update donation status
POST   /donations/:id/print-label→ Generate & print donation label
 */


const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware');
const donationController = require('../controllers/donation-bloodbag-controller');

router.route('/new').post(authMiddleware,donationController.newDonation);
router.route('/list').get(authMiddleware,donationController.getAllDonations);

module.exports = router;