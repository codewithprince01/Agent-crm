const express = require('express');
const router = express.Router();
const CourseController = require('../controllers/courseController');
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

router.get('/', authMiddleware, CourseController.getAllCourses);

router.get('/:id', authMiddleware, CourseController.getCourseById);

router.post(
  '/',
  authMiddleware,
  roleMiddleware(roles.ALL_ADMINS),
  [
    body('university_id').isInt().withMessage('Valid university ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('level').trim().notEmpty().withMessage('Level is required'),
    body('duration').trim().notEmpty().withMessage('Duration is required'),
    body('tuition_fee').isFloat({ min: 0 }).withMessage('Valid tuition fee is required'),
  ],
  validateRequest,
  CourseController.createCourse
);

router.put('/:id', authMiddleware, roleMiddleware(roles.ALL_ADMINS), CourseController.updateCourse);

router.delete('/:id', authMiddleware, roleMiddleware(roles.ALL_ADMINS), CourseController.deleteCourse);

module.exports = router;
