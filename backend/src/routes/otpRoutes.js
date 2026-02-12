const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const { verifyReferralCookie } = require('../middlewares/referralValidation');

/**
 * OTP Routes
 * All routes require valid referral cookie
 */

// Send OTP to email
router.post('/send', verifyReferralCookie, otpController.sendOTP);

// Verify OTP
router.post('/verify', verifyReferralCookie, otpController.verifyOTP);

// Resend OTP
router.post('/resend', verifyReferralCookie, otpController.resendOTP);

module.exports = router;
