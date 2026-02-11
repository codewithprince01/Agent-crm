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

const applicationLockMiddleware = require('../middlewares/applicationLockMiddleware');

/**
 * @route   GET /api/applications/pending-students
 * @desc    Get students without any applications
 * @access  Private (Agent, Admin)
 */
router.get('/pending-students', authMiddleware, ApplicationController.getPendingStudents);

/**
 * @route   GET /api/applications/applied-students
 * @desc    Get students with existing applications
 * @access  Private (Agent, Admin)
 */
router.get('/applied-students', authMiddleware, ApplicationController.getAppliedStudents);

/**
 * @route   GET /api/applications
 * @desc    Get all applications (filtered by role)
 * @access  Private
 */
router.get('/', authMiddleware, ApplicationController.getApplications);

/**
 * @route   POST /api/applications
 * @desc    Create new application
 * @access  Private (Agent, Admin)
 */
router.post(
  '/',
  authMiddleware,
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('programId').notEmpty().withMessage('Program ID is required'),
    body('programSnapshot').isObject().withMessage('Program details snapshot is required'),
  ],
  validateRequest,
  ApplicationController.createApplication
);

/**
 * @route   PUT /api/applications/:id
 * @desc    Update application
 * @access  Private (Agent, Admin)
 */
router.put('/:id', authMiddleware, applicationLockMiddleware, ApplicationController.getApplications); // Placeholder for update functionality if needed later

// Existing status update route with lock middleware
router.put(
  '/:id/status',
  authMiddleware,
  applicationLockMiddleware,
  roleMiddleware(roles.ALL_ADMINS),
  ApplicationController.getApplications // Placeholder
);

module.exports = router;
