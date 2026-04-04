import express from 'express';
import { 
  sendOtp, verifyOtp, resendOtp, login, updateProfile, 
  forgotPassword, resetPassword 
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit each IP to 10 OTP/Login requests per 15 mins
  message: "Too many attempts, please try again later"
});

const router = express.Router();

router.post('/send-otp', 
  authLimiter,
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('mobile').isMobilePhone('any').withMessage('Invalid mobile number'),
    body('address').notEmpty().withMessage('Address is required')
  ],
  sendOtp
);

router.post('/verify-otp', 
  authLimiter,
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  verifyOtp
);

router.post('/resend-otp', authLimiter, resendOtp);

router.post('/login', 
  authLimiter,
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  login
);

router.put('/profile', 
  authMiddleware, 
  [
    body('name').optional().notEmpty(),
    body('mobile').optional().isMobilePhone('any'),
    body('address').optional().notEmpty()
  ],
  updateProfile
);

router.post('/forgot-password', authLimiter, forgotPassword);

router.post('/reset-password', 
  authLimiter,
  [
    body('email').isEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 })
  ],
  resetPassword
);

export default router;
