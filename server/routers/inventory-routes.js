/*
GET    /inventory                → List inventory items
GET    /inventory/near-expiry    → Near expiry list
POST   /inventory/reserve        → Reserve stock for request
POST   /inventory/issue          → Issue reserved stock
POST   /inventory/discard        → Discard expired/unusable stock
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory-controller');
const authMiddleware = require('../middlewares/auth-middleware');

// Apply auth middleware to all inventory routes
router.use(authMiddleware);

// List inventory items with filters
router.route('/').get(authMiddleware,inventoryController.listInventory)

// Get near-expiry inventory items
router.route('/near-expiry').get(authMiddleware,inventoryController.getNearExpiryInventory)

// Reserve inventory items for a hospital request
router.route('/reserve').post(authMiddleware,inventoryController.reserveInventory);
router.route('/reserve/fifo').post(authMiddleware, inventoryController.reserveByCriteriaFIFO);

// Issue reserved inventory
router.route('/issue').post(authMiddleware,inventoryController.issueInventory)

// Unreserve reserved inventory
router.route('/unreserve').post(authMiddleware,inventoryController.unreserveInventory)

// Discard inventory items
router.post('/discard',authMiddleware,inventoryController.discardInventory);

module.exports = router;