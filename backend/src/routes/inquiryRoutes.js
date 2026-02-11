const express = require('express');
const router = express.Router();
const InquiryController = require('../controllers/inquiryController');

// Public routes for partner application
router.post('/partner-application', InquiryController.submitPartnerApplication);
router.post('/send-otp', InquiryController.sendVerificationOTP);
router.post('/verify-otp', InquiryController.verifyOTP);

module.exports = router;
