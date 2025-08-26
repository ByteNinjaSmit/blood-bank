/*
POST   /requests                 → Create hospital request
GET    /requests                 → List requests (filters)
GET    /requests/:id             → Get request details
POST   /requests/:id/match       → Match request with inventory
PATCH  /requests/:id/approve     → Approve matched request
PATCH  /requests/:id/reject      → Reject request
 */

const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request-controller');
const authMiddleware = require('../middlewares/auth-middleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create hospital request
router.post('/', requestController.createRequest);

// List requests with filters
router.get('/', requestController.listRequests);

// Get request details
router.get('/:id', requestController.getRequestById);

// Match request with inventory
router.post('/:id/match', requestController.matchRequest);

// Approve matched request
router.patch('/:id/approve', requestController.approveRequest);

// Reject request
router.patch('/:id/reject', requestController.rejectRequest);

module.exports = router;