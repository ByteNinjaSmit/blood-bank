const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware');
const misController = require('../controllers/mis-controller');

router.use(authMiddleware);

router.get('/donors', misController.getDonorMIS);
router.get('/donations', misController.getDonationMIS);
router.get('/camps', misController.getCampMIS);
router.get('/bags', misController.getBagMIS);
router.get('/components', misController.getComponentMIS);
router.get('/inventory', misController.getInventoryMIS);
router.get('/issues', misController.getIssueMIS);
router.get('/discards', misController.getDiscardMIS);
router.get('/testing', misController.getTestingMIS);
router.get('/exceptions', misController.getExceptionMIS);
router.get('/regulatory', misController.getRegulatoryMIS);
router.get('/dashboard', misController.getExecutiveMIS);

module.exports = router;
