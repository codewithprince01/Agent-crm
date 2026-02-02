const express = require('express');
const router = express.Router();
const CommissionController = require('../controllers/commissionController');
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

router.get('/', authMiddleware, CommissionController.getAllCommissions);

router.get('/rules', authMiddleware, roleMiddleware(roles.ALL_ADMINS), CommissionController.getRules);

router.post(
  '/rules',
  authMiddleware,
  roleMiddleware(roles.ALL_ADMINS),
  [
    body('commission_type').isIn(['percentage', 'flat']).withMessage('Valid commission type is required'),
    body('commission_value').isFloat({ min: 0 }).withMessage('Valid commission value is required'),
  ],
  validateRequest,
  CommissionController.createRule
);

router.put('/rules/:id', authMiddleware, roleMiddleware(roles.ALL_ADMINS), CommissionController.updateRule);

router.delete('/rules/:id', authMiddleware, roleMiddleware(roles.ALL_ADMINS), CommissionController.deleteRule);

router.put('/:id/approve', authMiddleware, roleMiddleware(roles.ALL_ADMINS), CommissionController.approveCommission);

module.exports = router;
