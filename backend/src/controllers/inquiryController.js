const { Agent } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const otpGenerator = require('../utils/otpGenerator');
const emailService = require('../services/emailService');

// In-memory OTP storage for simplicity in public registration
// For production, this should ideally be in Redis or a DB collection
const otpStore = new Map();

class InquiryController {
    /**
     * Submit Partner Application (Agent Registration)
     * POST /api/inquiry/partner-application
     */
    static async submitPartnerApplication(req, res) {
        try {
            const {
                firstName,
                lastName,
                email,
                phone,
                alternatePhone,
                companyName,
                companyType,
                registrationNumber,
                establishedYear,
                website,
                address,
                city,
                state,
                pincode,
                country = 'India',
                designation,
                experience,
                qualification,
                specialization,
                currentStudents,
                annualRevenue,
                teamSize,
                servicesOffered,
                partnershipType,
                expectedStudents,
                marketingBudget,
                references,
                whyPartner,
                additionalInfo,
                termsAccepted,
                dataConsent,
                documents // Expecting array of objects
            } = req.body;

            // 1. Capture tracking info
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const browser = req.headers['user-agent'] || 'Unknown';
            // Simple OS detection from user-agent could be added here or passed from frontend
            const os = req.body.os || 'Unknown';

            // 2. Prevent duplicate requests from same IP/Browser within a short timeframe (Optional but recommended)
            const RECENT_SUBMISSION_WINDOW = 5 * 60 * 1000; // 5 minutes
            const recentSubmission = await Agent.findOne({
                ipAddress,
                browser,
                createdAt: { $gt: new Date(Date.now() - RECENT_SUBMISSION_WINDOW) }
            });

            if (recentSubmission) {
                return ResponseHandler.error(res, 'Multiple submissions detected. Please wait a few minutes before trying again.', null, 429);
            }

            // 3. Unique Email and Phone Validation
            const existingAgentByEmail = await Agent.findOne({ email });
            if (existingAgentByEmail) {
                if (existingAgentByEmail.approvalStatus === 'pending') {
                    return ResponseHandler.error(res, 'You already have a pending application with this email.', null, 400);
                }
                return ResponseHandler.error(res, 'An account with this email already exists.', null, 400);
            }

            const existingAgentByPhone = await Agent.findOne({ phone });
            if (existingAgentByPhone) {
                if (existingAgentByPhone.approvalStatus === 'pending') {
                    return ResponseHandler.error(res, 'You already have a pending application with this phone number.', null, 400);
                }
                return ResponseHandler.error(res, 'An account with this phone number already exists.', null, 400);
            }

            // 4. Document Constraints: Check for duplicate documentType
            if (documents && Array.isArray(documents)) {
                const docTypes = documents.map(doc => doc.documentType);
                if (new Set(docTypes).size !== docTypes.length) {
                    return ResponseHandler.error(res, 'Duplicate document types are not allowed.', null, 400);
                }
            }

            // Generate a random temporary password
            const tempPassword = crypto.randomBytes(8).toString('hex');

            // Create Agent Record
            const agent = await Agent.create({
                // Auth (Generated)
                email,
                password: tempPassword,

                // Personal Info
                firstName,
                lastName,
                phone,
                alternatePhone,
                designation,
                experience,
                qualification,

                // Company Info
                companyName,
                companyType,
                registrationNumber,
                establishedYear: parseInt(establishedYear) || new Date().getFullYear(),
                website,
                address,
                city,
                state,
                pincode,
                country,

                // Specialization & Services
                specialization: specialization || [],
                servicesOffered: servicesOffered || [],

                // Business Metrics
                currentStudents,
                annualRevenue,
                teamSize,

                // Partnership Details
                partnershipType,
                expectedStudents,
                marketingBudget,
                whyPartner,
                references,
                additionalInfo,

                // Consent
                termsAccepted,
                dataConsent,
                termsAcceptedAt: termsAccepted ? new Date() : null,
                dataConsentAt: dataConsent ? new Date() : null,

                // Status
                status: 'inactive',
                approvalStatus: 'pending',

                // Tracking
                ipAddress,
                browser,
                os,

                // Documents
                documents: documents || []
            });

            return ResponseHandler.success(res, 'Application submitted successfully. Our team will review your application and contact you shortly.');

        } catch (error) {
            console.error('Partner Application Error:', error);
            return ResponseHandler.serverError(res, 'Failed to submit application. Please try again later.', error);
        }
    }

    /**
     * Send Verification OTP
     * POST /api/inquiry/send-otp
     */
    static async sendVerificationOTP(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return ResponseHandler.badRequest(res, 'Email is required');
            }

            // Check if email is already registered/pending
            const existingAgent = await Agent.findOne({ email });
            if (existingAgent) {
                return ResponseHandler.badRequest(res, 'This email is already registered or has a pending application.');
            }

            const otp = otpGenerator.generateOTP();
            const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

            otpStore.set(email, { otp, expires });

            await emailService.sendVerificationOTP(email, otp);

            return ResponseHandler.success(res, 'Verification code sent to your email.');
        } catch (error) {
            console.error('Send OTP Error:', error);
            return ResponseHandler.serverError(res, 'Failed to send verification code.', error);
        }
    }

    /**
     * Verify OTP
     * POST /api/inquiry/verify-otp
     */
    static async verifyOTP(req, res) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return ResponseHandler.badRequest(res, 'Email and OTP are required');
            }

            const stored = otpStore.get(email);
            if (!stored) {
                return ResponseHandler.badRequest(res, 'No verification code found for this email.');
            }

            if (Date.now() > stored.expires) {
                otpStore.delete(email);
                return ResponseHandler.badRequest(res, 'Verification code has expired.');
            }

            if (stored.otp !== otp) {
                return ResponseHandler.badRequest(res, 'Invalid verification code.');
            }

            // Success - mark as verified in store so it can be checked during final submission if needed
            // Or just return success. For now, we'll return success and the frontend will proceed.
            // Ideally, we'd sign a short-lived token here to prove verification during submitPartnerApplication.
            stored.verified = true;

            return ResponseHandler.success(res, 'Email verified successfully.');
        } catch (error) {
            console.error('Verify OTP Error:', error);
            return ResponseHandler.serverError(res, 'Failed to verify code.', error);
        }
    }
}

module.exports = InquiryController;
