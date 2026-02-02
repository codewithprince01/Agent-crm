const express = require('express');
const router = express.Router();
const UniversityController = require('../controllers/universityController');
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

router.get('/', authMiddleware, UniversityController.getAllUniversities);

router.get('/:id', authMiddleware, UniversityController.getUniversityById);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(roles.ALL_ADMINS),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
  ],
  validateRequest,
  UniversityController.createUniversity
);

router.put('/:id', authMiddleware, roleMiddleware(roles.ALL_ADMINS), UniversityController.updateUniversity);

router.delete('/:id', authMiddleware, roleMiddleware(roles.ALL_ADMINS), UniversityController.deleteUniversity);

module.exports = router;
