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

router.route('/new').post(donorController.registerDonor);
router.route('/update/:id').put(donorController.updateDonor);
router.route('/:id').get(donorController.getDonorDetails);
router.route('/list').get(donorController.listDonors);

module.exports = router;