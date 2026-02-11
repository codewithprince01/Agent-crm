const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware, roles } = require('../middlewares/roleMiddleware');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'upload/student/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, JPEG, PNG files are allowed'));
  },
});

const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

router.get('/', authMiddleware, StudentController.getAllStudents);

// Get current student's own profile (must be before /:id route)
router.get('/me', authMiddleware, StudentController.getMyProfile);

// Update current student's own profile
router.put('/me', authMiddleware, StudentController.updateMyProfile);

// Upload current student's own document
router.post(
  '/me/documents',
  authMiddleware,
  upload.single('document'),
  [body('document_type').trim().notEmpty().withMessage('Document type is required')],
  validateRequest,
  StudentController.uploadMyDocument
);

// Delete current student's own document
router.delete(
  '/me/documents/:documentId',
  authMiddleware,
  StudentController.deleteMyDocument
);

router.get('/:id', authMiddleware, StudentController.getStudentById);

router.post(
  '/',
  authMiddleware,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  StudentController.createStudent
);

router.put('/:id', authMiddleware, StudentController.updateStudent);

router.delete('/:id', authMiddleware, StudentController.deleteStudent);

router.post(
  '/:id/documents',
  authMiddleware,
  upload.single('document'),
  [body('document_type').trim().notEmpty().withMessage('Document type is required')],
  validateRequest,
  StudentController.uploadDocument
);

router.delete(
  '/:id/documents/:documentId',
  authMiddleware,
  // potentially add role check here if needed, butauthMiddleware might handle basic user context
  StudentController.deleteDocument
);

module.exports = router;
