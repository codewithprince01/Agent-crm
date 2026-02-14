const Student = require('../models/Student');
const { generateTempStudentId } = require('../utils/generateTempId');

/**
 * Map form fields to database schema fields
 */
const mapFormToSchema = (formData) => {
    // Helper to convert empty strings to undefined (to avoid enum/date validation errors)
    const sanitize = (val) => (val === '' || val === null ? undefined : val);

    return {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email?.toLowerCase(),
        phone: formData.mobile,
        countryCode: formData.c_code,
        fatherName: formData.father,
        motherName: formData.mother,
        dateOfBirth: sanitize(formData.dob),
        firstLanguage: formData.first_language,
        nationality: sanitize(formData.nationality), // Enum-like (if restricted)
        passportNumber: formData.passport_number,
        passportExpiry: sanitize(formData.passport_expiry),
        maritalStatus: sanitize(formData.marital_status), // Enum
        gender: sanitize(formData.gender), // Enum
        address: formData.home_address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.zipcode,
        educationCountry: sanitize(formData.education_country),
        highestLevel: sanitize(formData.highest_level),
        gradingScheme: sanitize(formData.grading_scheme),
        gradeAverage: formData.grade_average,
        examType: formData.exam_type,
        examDate: sanitize(formData.exam_date),
        listeningScore: formData.listening_score,
        readingScore: formData.reading_score,
        writingScore: formData.writing_score,
        speakingScore: formData.speaking_score,
        overallScore: formData.overall_score,
        visaRefusal: formData.visa_refusal,
        studyPermit: formData.study_permit,
        backgroundDetails: formData.background_details,
        referredBy: formData.referredBy,
        identityProofType: sanitize(formData.identityProofType) || sanitize(formData.identity_type), // Handle both keys
        identityProofNumber: formData.identityProofNumber || formData.identity_number
    };
};

/**
 * Create initial draft (Step 1)
 * POST /api/students/draft/step1
 */
exports.createDraft = async (req, res) => {
    try {
        const formData = req.body;
        const EmailVerification = require('../models/EmailVerification');

        // NEW: Check email verification first
        const verification = await EmailVerification.findOne({
            email: formData.email?.toLowerCase(),
            verified: true,
            expiresAt: { $gt: new Date() }
        });

        if (!verification) {
            return res.status(403).json({
                success: false,
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Please verify your email before proceeding'
            });
        }

        // Check for existing completed registration with this email
        const existingCompleted = await Student.findOne({
            email: formData.email?.toLowerCase(),
            isCompleted: true
        });

        if (existingCompleted) {
            return res.status(400).json({
                success: false,
                code: 'EMAIL_ALREADY_REGISTERED',
                message: 'This email is already registered. Please use a different email or contact support.'
            });
        }

        // Check if incomplete registration exists with this email
        let student = await Student.findOne({
            email: formData.email?.toLowerCase(),
            isCompleted: false
        });

        const mappedData = mapFormToSchema(formData);

        if (student) {
            // Update existing incomplete draft with all mapped data
            Object.keys(mappedData).forEach(key => {
                if (mappedData[key] !== undefined) {
                    student[key] = mappedData[key];
                }
            });
            student.currentStep = 1;
            student.lastSavedStep = 1;
            student.isEmailVerified = true;
            student.emailVerifiedAt = new Date();

            await student.save();
        } else {
            // Create new draft
            const tempStudentId = generateTempStudentId();

            student = new Student({
                tempStudentId,
                ...mappedData,
                currentStep: 1,
                lastSavedStep: 1,
                isDraft: true,
                isCompleted: false,
                isEmailVerified: true,
                emailVerifiedAt: new Date()
            });

            await student.save();
        }

        res.status(200).json({
            success: true,
            tempStudentId: student.tempStudentId,
            currentStep: student.currentStep,
            message: 'Step 1 saved successfully'
        });
    } catch (error) {
        console.error('Error creating draft:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save Step 1',
            error: error.message
        });
    }
};

/**
 * Update draft step
 * PUT /api/students/draft/:tempId/step/:stepNumber
 */
exports.updateDraftStep = async (req, res) => {
    try {
        const { tempId, stepNumber } = req.params;
        const { stepData } = req.body;

        const student = await Student.findOne({
            tempStudentId: tempId,
            isDraft: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        // Map and update step-specific data
        const mappedData = mapFormToSchema(stepData);
        Object.keys(mappedData).forEach(key => {
            if (mappedData[key] !== undefined) {
                student[key] = mappedData[key];
            }
        });

        // Update tracking fields
        const step = parseInt(stepNumber);
        student.currentStep = step;
        student.lastSavedStep = Math.max(student.lastSavedStep, step);

        await student.save();

        res.status(200).json({
            success: true,
            currentStep: student.currentStep,
            message: `Step ${step} saved successfully`
        });
    } catch (error) {
        console.error('Error updating draft step:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save step',
            error: error.message
        });
    }
};

/**
 * Get draft data (Resume)
 * GET /api/students/draft/:tempId
 */
exports.getDraft = async (req, res) => {
    try {
        const { tempId } = req.params;

        const student = await Student.findOne({
            tempStudentId: tempId,
            isDraft: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found or expired'
            });
        }

        // Helper to format date to YYYY-MM-DD for input[type="date"]
        const formatDateForInput = (date) => {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // Map schema fields back to form fields
        const formData = {
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            mobile: student.phone,
            c_code: student.countryCode,
            father: student.fatherName,
            mother: student.motherName,
            dob: formatDateForInput(student.dateOfBirth),
            first_language: student.firstLanguage,
            nationality: student.nationality,
            passport_number: student.passportNumber,
            passport_expiry: formatDateForInput(student.passportExpiry),
            marital_status: student.maritalStatus,
            gender: student.gender,
            home_address: student.address,
            city: student.city,
            state: student.state,
            country: student.country,
            zipcode: student.postalCode,
            education_country: student.educationCountry,
            highest_level: student.highestLevel,
            grading_scheme: student.gradingScheme,
            grade_average: student.gradeAverage,
            exam_type: student.examType,
            exam_date: formatDateForInput(student.examDate),
            listening_score: student.listeningScore,
            reading_score: student.readingScore,
            writing_score: student.writingScore,
            speaking_score: student.speakingScore,
            overall_score: student.overallScore,
            visa_refusal: student.visaRefusal,
            study_permit: student.studyPermit,
            background_details: student.backgroundDetails,
            referredBy: student.referredBy
        };

        res.status(200).json({
            success: true,
            student: {
                tempStudentId: student.tempStudentId,
                currentStep: student.currentStep,
                lastSavedStep: student.lastSavedStep,
                formData,
                referredBy: student.referredBy
            }
        });
    } catch (error) {
        console.error('Error fetching draft:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve draft',
            error: error.message
        });
    }
};

/**
 * Complete registration (Final submission)
 * POST /api/students/draft/:tempId/complete
 */
exports.completeDraft = async (req, res) => {
    try {
        const { tempId } = req.params;
        const { finalStepData, password } = req.body;

        const student = await Student.findOne({
            tempStudentId: tempId,
            isDraft: true
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found'
            });
        }

        // Check if email already exists for completed students
        const existingStudent = await Student.findOne({
            email: student.email,
            isCompleted: true,
            _id: { $ne: student._id }
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                code: 'EMAIL_EXISTS',
                message: 'Email already registered. Please use a different email.'
            });
        }

        // Update final step data with proper mapping
        if (finalStepData) {
            const mappedData = mapFormToSchema(finalStepData);
            Object.keys(mappedData).forEach(key => {
                if (mappedData[key] !== undefined) {
                    student[key] = mappedData[key];
                }
            });
        }

        // Set password if provided
        if (password) {
            student.password = password;
        }

        // Generate studentId if not exists
        if (!student.studentId) {
            const generateStudentId = () => {
                const prefix = 'STU';
                const timestamp = Date.now().toString().slice(-6);
                const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                return `${prefix}${timestamp}${random}`;
            };
            student.studentId = generateStudentId();
        }

        // Generate setup token (expires in 24 hours)
        const crypto = require('crypto');
        const setupToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Mark as completed
        student.isCompleted = true;
        student.isDraft = false;
        student.currentStep = 4;
        student.lastSavedStep = 4;
        student.isPasswordSet = false;
        student.passwordSetupToken = setupToken;
        student.passwordSetupExpires = tokenExpires;

        await student.save();

        // Send welcome email with password setup link
        const emailService = require('../services/emailService');
        await emailService.sendStudentWelcomeEmail(student, setupToken);

        res.status(200).json({
            success: true,
            studentId: student._id,
            message: 'Registration completed successfully'
        });
    } catch (error) {
        console.error('Error completing registration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete registration',
            error: error.message
        });
    }
};

/**
 * Delete old drafts (Cleanup - can be called by cron job)
 * DELETE /api/students/draft/cleanup
 */
exports.cleanupOldDrafts = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await Student.deleteMany({
            isDraft: true,
            isCompleted: false,
            createdAt: { $lt: thirtyDaysAgo }
        });

        res.status(200).json({
            success: true,
            message: `Cleaned up ${result.deletedCount} old drafts`
        });
    } catch (error) {
        console.error('Error cleaning up drafts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup drafts',
            error: error.message
        });
    }
};
