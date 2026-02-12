const mongoose = require('mongoose');
const User = require('../models/User');
const Agent = require('../models/Agent');
const { generateSignedToken } = require('../utils/tokenUtils');

/**
 * Middleware to validate referral ID and set secure cookie
 * Validates:
 * 1. Referral ID exists in request
 * 2. Format is valid (24 characters)
 * 3. Valid MongoDB ObjectId
 * 4. User exists in database
 * 5. User is active
 */
const validateReferral = async (req, res, next) => {
    try {
        const referralId = req.query.ref || req.body.referralId;

        // Check if referral ID exists
        if (!referralId) {
            return res.status(404).json({
                success: false,
                message: 'Referral ID is required to access this page'
            });
        }

        // Check exact length (24 characters for MongoDB ObjectId)
        if (referralId.length !== 24) {
            console.warn(`Invalid referral ID length: ${referralId.length} characters`);
            return res.status(404).json({
                success: false,
                message: 'Invalid referral link'
            });
        }

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(referralId)) {
            console.warn(`Invalid ObjectId format: ${referralId}`);
            return res.status(404).json({
                success: false,
                message: 'Invalid referral link'
            });
        }

        // Check if user exists in database (check User first, then Agent)
        let referrer = await User.findById(referralId);
        let referrerRole = '';
        let referrerName = '';

        if (!referrer) {
            referrer = await Agent.findById(referralId);
            if (!referrer) {
                console.warn(`Referral user/agent not found: ${referralId}`);
                return res.status(404).json({
                    success: false,
                    message: 'Referral link is invalid or expired'
                });
            }
            referrerRole = 'AGENT';
            referrerName = `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim();
        } else {
            referrerRole = referrer.role;
            referrerName = referrer.name;
        }

        // Check if user is active
        if (referrer.status !== 'active') {
            console.warn(`Inactive referrer: ${referralId}, status: ${referrer.status}`);
            return res.status(403).json({
                success: false,
                message: 'This referral link is no longer active'
            });
        }

        // Generate signed token
        const cookieSecret = process.env.REFERRAL_COOKIE_SECRET || 'default-secret-change-in-production';
        const token = generateSignedToken({
            referralId: referrer._id.toString(),
            userRole: referrerRole,
            userName: referrerName
        }, cookieSecret);

        // Set HTTP-only cookie
        const cookieExpiry = parseInt(process.env.REFERRAL_COOKIE_EXPIRY_DAYS) || 30;
        res.cookie('student_referral', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: 'lax',
            maxAge: cookieExpiry * 24 * 60 * 60 * 1000, // Convert days to milliseconds
            path: '/'
        });

        // Attach referral info to request for downstream use
        req.referralInfo = {
            id: referrer._id.toString(),
            role: referrerRole,
            name: referrerName
        };

        next();
    } catch (error) {
        console.error('Error in referral validation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to validate referral'
        });
    }
};

/**
 * Middleware to verify referral cookie on subsequent requests
 * Used for multi-step form validation
 */
const verifyReferralCookie = (req, res, next) => {
    try {
        const token = req.cookies.student_referral;

        if (!token) {
            return res.status(403).json({
                success: false,
                message: 'Referral session expired. Please use your referral link again.'
            });
        }

        const { verifySignedToken } = require('../utils/tokenUtils');
        const cookieSecret = process.env.REFERRAL_COOKIE_SECRET || 'default-secret-change-in-production';
        const decoded = verifySignedToken(token, cookieSecret);

        if (!decoded) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or tampered referral session'
            });
        }

        // Attach referral info to request
        req.referralInfo = {
            id: decoded.referralId,
            role: decoded.userRole,
            name: decoded.userName
        };

        next();
    } catch (error) {
        console.error('Error verifying referral cookie:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to verify referral session'
        });
    }
};

module.exports = {
    validateReferral,
    verifyReferralCookie
};
