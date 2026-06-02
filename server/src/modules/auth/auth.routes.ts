import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '@/shared/middlewares/authenticate';

const router = Router();

// Public — no auth.
router.post('/login', authController.login);
router.post('/login/start-otp', authController.startOtpLogin);
router.post('/login/verify-otp', authController.verifyOtpLogin);
router.post('/login/resend-otp', authController.resendOtpLogin);

router.post('/register/start-otp', authController.startRegister);
router.post('/register/verify-otp', authController.verifyRegister);
router.post('/register/resend-otp', authController.resendRegisterOtp);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Authenticated.
router.get('/current', authenticate, authController.current);

export default router;
