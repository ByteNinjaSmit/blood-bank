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

// Separate components from donation
router.post(
  '/separate',
  authMiddleware,
  roleMiddleware(['admin', 'technician', 'supervisor']),
  componentController.separateComponents
);

// List components with filters
router.get(
  '/',
  authMiddleware,
  componentController.listComponents
);

// Get component details by ID
router.get(
  '/:id',
  authMiddleware,
  componentController.getComponentById
);

// Update component status
router.patch(
  '/:id/status',
  authMiddleware,
  roleMiddleware(['admin', 'technician', 'supervisor']),
  componentController.updateComponentStatus
);

// Generate and print component label
router.post(
  '/:id/print-label',
  authMiddleware,
  componentController.printComponentLabel
);

module.exports = router;