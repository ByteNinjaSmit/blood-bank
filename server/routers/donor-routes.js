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
const { authMiddleware } = require('../middlewares/auth-middleware');

// Routes for donor management
router.route('/')
  .post(authMiddleware, donorController.registerDonor)
  .get(authMiddleware, donorController.listDonors);

router.route('/:id')
  .get(authMiddleware, donorController.getDonorById)
  .put(authMiddleware, donorController.updateDonor)
  .delete(authMiddleware, donorController.deleteDonor);

module.exports = router;