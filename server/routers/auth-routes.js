/*
POST   /auth/login               → Login user, get JWT
POST   /auth/refresh             → Refresh access token
POST   /auth/logout              → Invalidate token
POST   /auth/change-password     → Change current user password
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth-controller");
const authMiddleware = require("../middlewares/auth-middleware"); 

router.post("/register", authController.registerUser);
// Registration OTP endpoints
router.post("/register/start-otp", authController.startRegisterOtp);
router.post("/register/verify-otp", authController.verifyRegisterOtp);
router.post("/register/resend-otp", authController.resendRegisterOtp);
router.post("/login", authController.loginUser);
// OTP login endpoints
router.post("/login/start-otp", authController.startOtpLogin);
router.post("/login/verify-otp", authController.verifyOtpLogin);
router.post("/login/resend-otp", authController.resendOtpLogin);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/current", authMiddleware, authController.getCurrentUser);
// router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
