/*
POST   /donors                   → Register donor
GET    /donors                   → List donors (filters: group, eligibility, date)
GET    /donors/:id               → Get donor details with history
PUT    /donors/:id               → Update donor info
DELETE /donors/:id               → Soft delete donor
 */



const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donor-controller');
const authMiddleware = require('../middlewares/auth-middleware');

router.route('/new').post(authMiddleware,donorController.registerDonor);
router.route('/update/:id').put(authMiddleware,donorController.updateDonor);
router.route('/:id').get(authMiddleware,donorController.getDonorDetails);
router.route('/list').get(authMiddleware,donorController.listDonors);

module.exports = router;