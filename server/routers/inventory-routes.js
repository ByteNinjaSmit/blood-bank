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
router.get('/', inventoryController.listInventory);

// Get near-expiry inventory items
router.get('/near-expiry', inventoryController.getNearExpiryInventory);

// Reserve inventory items for a hospital request
router.post('/reserve', inventoryController.reserveInventory);

// Issue reserved inventory
router.post('/issue', inventoryController.issueInventory);

// Discard inventory items
router.post('/discard', inventoryController.discardInventory);

module.exports = router;