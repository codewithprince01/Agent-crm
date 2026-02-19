const express = require('express');
const router = express.Router();
const StudentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware, roles } = require('../middlewares/roleMiddleware');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');

const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
  }
  next();
};

const documentUpload = require('../middlewares/documentUploadMiddleware');

router.get('/', authMiddleware, StudentController.getAllStudents);

// Get current student's own profile (must be before /:id route)
router.get('/me', authMiddleware, StudentController.getMyProfile);

// Update current student's own profile
router.put('/me', authMiddleware, StudentController.updateMyProfile);

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

// --- Student Document Management (Parity with Agents) ---

// Self-service (Student role)
router.post(
  '/me/documents',
  authMiddleware,
  documentUpload.single('file'),
  StudentController.uploadMyDocument
);

router.delete(
  '/me/documents/:documentName',
  authMiddleware,
  StudentController.deleteMyDocument
);

// Admin/Staff/Agent service
router.post(
  '/:id/documents',
  authMiddleware,
  documentUpload.single('file'),
  StudentController.uploadDocument
);

router.delete(
  '/:id/documents/:documentName',
  authMiddleware,
  StudentController.deleteDocument
);

// Bulk upload
const docFields = [
  { name: 'photo', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'marksheet_10', maxCount: 1 },
  { name: 'marksheet_12', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'degreeCertificate', maxCount: 1 },
  { name: 'identity_proof', maxCount: 1 },
];

router.post(
  '/:id/documents/bulk',
  authMiddleware,
  documentUpload.fields(docFields),
  StudentController.uploadBulkDocuments
);

module.exports = router;
