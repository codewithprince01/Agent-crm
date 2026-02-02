const express = require('express');
const router = express.Router();
const AgentController = require('../controllers/agentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware, roles } = require('../middlewares/roleMiddleware');
const { body, query } = require('express-validator');

const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

/**
 * @route   GET /api/agents
 * @desc    Get all agents
 * @access  Private (Admin, Super Admin)
 */
router.get('/', authMiddleware, roleMiddleware(roles.ALL_ADMINS), AgentController.getAllAgents);

/**
 * @route   GET /api/agents/pending
 * @desc    Get pending agents
 * @access  Private (Admin, Super Admin)
 */
router.get('/pending', authMiddleware, roleMiddleware(roles.ALL_ADMINS), AgentController.getPendingAgents);

/**
 * @route   GET /api/agents/:id
 * @desc    Get agent by ID
 * @access  Private (Admin, Super Admin, Own Agent)
 */
router.get('/:id', authMiddleware, AgentController.getAgentById);

/**
 * @route   PUT /api/agents/:id/approve
 * @desc    Approve agent
 * @access  Private (Admin, Super Admin)
 */
router.put(
  '/:id/approve',
  authMiddleware,
  roleMiddleware(roles.ALL_ADMINS),
  [body('notes').optional().isString()],
  validateRequest,
  AgentController.approveAgent
);

/**
 * @route   PUT /api/agents/:id/reject
 * @desc    Reject agent
 * @access  Private (Admin, Super Admin)
 */
router.put(
  '/:id/reject',
  authMiddleware,
  roleMiddleware(roles.ALL_ADMINS),
  [body('notes').optional().isString()],
  validateRequest,
  AgentController.rejectAgent
);

/**
 * @route   PUT /api/agents/:id/bank-details
 * @desc    Update agent bank details
 * @access  Private (Agent own, Admin)
 */
router.put(
  '/:id/bank-details',
  authMiddleware,
  [
    body('bank_name').trim().notEmpty().withMessage('Bank name is required'),
    body('account_number').trim().notEmpty().withMessage('Account number is required'),
    body('account_holder_name').trim().notEmpty().withMessage('Account holder name is required'),
  ],
  validateRequest,
  AgentController.updateBankDetails
);

module.exports = router;
