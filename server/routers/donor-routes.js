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

router.route('/new').post(authMiddleware, donorController.registerDonor);
router.route('/update/:id').put(authMiddleware, donorController.updateDonor);
router.route('/list').get(authMiddleware, donorController.listDonors);
router.route('/search').get(authMiddleware, donorController.searchDonorLatestDonation);
router.route('/search/fast').get(authMiddleware, donorController.fastSearchDonors);
// Force delete must be declared before generic :id route
router.route('/force/:id').delete(authMiddleware, donorController.forceDeleteDonor);
router
  .route('/:id')
  .get(authMiddleware, donorController.getDonorDetails)
  .delete(authMiddleware, donorController.deleteDonor);

module.exports = router;
