const express = require('express');
const router = express.Router();
const PayoutController = require('../controllers/payoutController');
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

router.get('/', authMiddleware, PayoutController.getAllPayouts);

router.get('/earnings', authMiddleware, PayoutController.getEarnings);

router.post(
  '/request',
  authMiddleware,
  roleMiddleware(roles.AGENT_ONLY),
  [body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required')],
  validateRequest,
  PayoutController.requestPayout
);

router.put('/:id/approve', authMiddleware, roleMiddleware(roles.ALL_ADMINS), PayoutController.approvePayout);

router.put('/:id/reject', authMiddleware, roleMiddleware(roles.ALL_ADMINS), PayoutController.rejectPayout);

router.put('/:id/mark-paid', authMiddleware, roleMiddleware(roles.ALL_ADMINS), PayoutController.markAsPaid);

module.exports = router;
