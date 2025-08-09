/*
POST   /auth/login               → Login user, get JWT
POST   /auth/refresh             → Refresh access token
POST   /auth/logout              → Invalidate token
POST   /auth/change-password     → Change current user password
 */


const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth-controller');
const { authMiddleware } = require('../middlewares/auth-middleware'); // JWT validation

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
