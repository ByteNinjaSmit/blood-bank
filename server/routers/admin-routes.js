const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth-middleware');
const adminMiddleware = require('../middlewares/admin-middleware');
const adminController = require('../controllers/admin-controller');

// All routes here require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// Users management
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// User status transitions
router.post('/users/:id/approve', adminController.approveUser);
router.post('/users/:id/reject', adminController.rejectUser);
router.post('/users/:id/block', adminController.blockUser);
router.post('/users/:id/deactivate', adminController.deactivateUser);

module.exports = router;
