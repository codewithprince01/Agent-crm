const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// Validation middleware
const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   POST /api/auth/login
 * @desc    User login (Admin/Super Admin/Student)
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  AuthController.login
);

/**
 * @route   POST /api/auth/agent-login
 * @desc    Agent login (separate authentication)
 * @access  Public
 */
router.post(
  '/agent-login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  AuthController.agentLogin
);

/**
 * @route   POST /api/auth/student-login
 * @desc    Student login
 * @access  Public
 */
router.post(
  '/student-login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  AuthController.studentLogin
);

/**
 * @route   POST /api/auth/register-agent
 * @desc    Register new agent
 * @access  Public
 */
router.post(
  '/register-agent',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('company_name').trim().notEmpty().withMessage('Company name is required'),
    body('country').trim().notEmpty().withMessage('Country is required'),
  ],
  validateRequest,
  AuthController.registerAgent
);

/**
 * @route   POST /api/auth/register-student
 * @desc    Register new student
 * @access  Public
 */
router.post(
  '/register-student',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  validateRequest,
  AuthController.registerStudent
);

/**
 * @route   POST /api/auth/student/setup-password
 * @desc    Student setup password (first-time)
 * @access  Public
 */
router.post(
  '/student/setup-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateRequest,
  AuthController.studentSetupPassword
);

/**
 * @route   POST /api/auth/student/forgot-password
 * @desc    Request student password reset OTP
 * @access  Public
 */
router.post(
  '/student/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  validateRequest,
  AuthController.studentForgotPassword
);

/**
 * @route   POST /api/auth/student/verify-otp
 * @desc    Verify student OTP
 * @access  Public
 */
router.post(
  '/student/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validateRequest,
  AuthController.studentVerifyOTP
);

/**
 * @route   POST /api/auth/student/reset-password
 * @desc    Reset student password with token
 * @access  Public
 */
router.post(
  '/student/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validateRequest,
  AuthController.studentResetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, AuthController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post('/logout', authMiddleware, AuthController.logout);

/**
 * @route   POST /api/auth/setup-password
 * @desc    Setup password (first-time)
 * @access  Public
 */
router.post(
  '/setup-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
  ],
  validateRequest,
  AuthController.setupPassword
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  validateRequest,
  AuthController.forgotPassword
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and get reset token
 * @access  Public
 */
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validateRequest,
  AuthController.verifyOTP
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
  ],
  validateRequest,
  AuthController.resetPassword
);

module.exports = router;
