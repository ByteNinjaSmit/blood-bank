/**
POST   /users                    → Create user (admin only)
GET    /users                    → List users (with filters)
GET    /users/:id                → Get user details
PUT    /users/:id                → Update user profile/role/permissions
DELETE /users/:id                → Soft delete / deactivate user
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user-controller');
const { authMiddleware } = require('../middlewares/auth-middleware');
const { roleMiddleware } = require('../middlewares/role-middleware');

// Create user (admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  userController.createUser
);

// List users (with filters)
router.get(
  '/',
  authMiddleware,
  userController.listUsers
);

// Get user details
router.get(
  '/:id',
  authMiddleware,
  userController.getUserById
);

// Update user profile/role/permissions
router.put(
  '/:id',
  authMiddleware,
  userController.updateUser
);

// Soft delete / deactivate user (admin only)
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  userController.deleteUser
);

module.exports = router;