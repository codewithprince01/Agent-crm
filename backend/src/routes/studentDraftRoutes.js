const express = require('express');
const router = express.Router();
const studentDraftController = require('../controllers/studentDraftController');
const studentUploadController = require('../controllers/studentUploadController');
const { validateReferral, verifyReferralCookie } = require('../middlewares/referralValidation');

/**
 * Draft Routes
 * These routes handle the multi-step registration with draft/resume capability
 */

// Step 1: Create initial draft (requires valid referral cookie)
router.post('/step1', verifyReferralCookie, studentDraftController.createDraft);

// Upload Document
router.post('/:tempId/upload', verifyReferralCookie, studentUploadController.uploadDocument);

// Upload Documents (Batch)
router.post('/:tempId/upload-batch', verifyReferralCookie, studentUploadController.uploadBatchDocuments);

// Update draft step (requires valid referral cookie)
router.put('/:tempId/step/:stepNumber', verifyReferralCookie, studentDraftController.updateDraftStep);

// Get draft data for resume (requires valid referral cookie)
router.get('/:tempId', verifyReferralCookie, studentDraftController.getDraft);

// Complete registration (requires valid referral cookie)
router.post('/:tempId/complete', verifyReferralCookie, studentDraftController.completeDraft);

// Cleanup old drafts (admin only - no referral needed)
router.delete('/cleanup', studentDraftController.cleanupOldDrafts);

module.exports = router;
