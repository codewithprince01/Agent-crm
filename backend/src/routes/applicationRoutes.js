const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware, roles } = require('../middlewares/roleMiddleware');
const { body } = require('express-validator');

const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

/**
 * @route   GET /api/applications
 * @desc    Get all applications
 * @access  Private (All authenticated users - filtered by role)
 */
router.get('/', authMiddleware, ApplicationController.getAllApplications);

/**
 * @route   POST /api/applications
 * @desc    Create new application
 * @access  Private (Agent, Admin)
 */
router.post(
  '/',
  authMiddleware,
  [
    body('student_id').isInt().withMessage('Valid student ID is required'),
    body('course_id').isInt().withMessage('Valid course ID is required'),
    body('intake_date').optional().isString(),
  ],
  validateRequest,
  ApplicationController.createApplication
);

/**
 * @route   GET /api/applications/:id
 * @desc    Get application by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, ApplicationController.getApplicationById);

/**
 * @route   PUT /api/applications/:id/status
 * @desc    Update application status
 * @access  Private (Admin, Super Admin)
 */
router.put(
  '/:id/status',
  authMiddleware,
  roleMiddleware(roles.ALL_ADMINS),
  [
    body('status')
      .isIn(['draft', 'submitted', 'under_review', 'offer_issued', 'offer_accepted', 'fee_paid', 'enrolled', 'rejected'])
      .withMessage('Valid status is required'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  ApplicationController.updateStatus
);

/**
 * @route   GET /api/applications/:id/history
 * @desc    Get application status history
 * @access  Private
 */
router.get('/:id/history', authMiddleware, ApplicationController.getStatusHistory);

module.exports = router;
