/*
POST   /components/separate      → Separate components from donation
GET    /components               → List components (filters)
GET    /components/:id           → Get component details
PATCH  /components/:id/status    → Update component status
POST   /components/:id/print-label → Print component label
 */

const express = require('express');
const router = express.Router();
const componentController = require('../controllers/component-controller');
const  authMiddleware  = require('../middlewares/auth-middleware');
const { roleMiddleware } = require('../middlewares/role-middleware');


router.route('/separate').post(authMiddleware,componentController.separateComponents);
router.route('/bags-to-separate').get(authMiddleware,componentController.getBagsToSeparateComponent);
router.route('/separation-completed').post(authMiddleware,componentController.separateComponents);
router.route('/list').get(authMiddleware,componentController.getComponentsList);
router.route('/:id').get(authMiddleware,componentController.getComponentDetails);

module.exports = router;