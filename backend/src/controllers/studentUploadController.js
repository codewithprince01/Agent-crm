const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configure Multer Storage for Student Documents
 * Path: uploads/documents/students/<studentname>_<id>_<time>/<filename>
 */
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            const { tempId } = req.params;

            // Find the student draft to get name and details
            const student = await Student.findOne({ tempStudentId: tempId, isDraft: true });

            if (!student) {
                return cb(new Error('Student draft not found'), null);
            }

            // Folder: FirstName_LastName_Email (Unified structure)
            const safeName = `${student.firstName}_${student.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
            const safeEmail = student.email.replace(/[^a-zA-Z0-9]/g, '_'); // Basic sanitization for FS
            const folderName = `${safeName}_${safeEmail}`;

            const baseUploadPath = 'uploads/documents/students';
            const fullPath = path.join(process.cwd(), baseUploadPath, folderName);

            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
            }

            cb(null, fullPath);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: function (req, file, cb) {
        // Filename: <docType>-<timestamp>-<originalName>
        // Adding timestamp to avoid overwriting if we want to keep history in temp
        const docType = req.body.documentType || file.fieldname || 'doc';
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${docType}-${Date.now()}-${cleanFileName}`);
    }
});

// File Filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images, PDF, and Word documents are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
}).single('file');

/**
 * Upload Student Document
 * POST /api/students/draft/:tempId/upload
 */
exports.uploadDocument = (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            console.error('Unknown Upload Error:', err);
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            console.log('Upload Request Body:', req.body);
            console.log('Upload Request File:', req.file);
            console.log('Upload Request Params:', req.params);

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const { tempId } = req.params;
            const { documentType, documentName } = req.body;

            const student = await Student.findOne({ tempStudentId: tempId, isDraft: true });
            if (!student) {
                console.error('Draft not found for tempId:', tempId);
                return res.status(404).json({ success: false, message: 'Draft not found' });
            }

            // Construct relative URL for frontend
            const relativePath = req.file.path.replace(process.cwd(), '').replace(/\\/g, '/');
            const fileUrl = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

            const newDocument = {
                documentType,
                documentName: documentName || req.file.originalname,
                documentUrl: fileUrl,
                verified: false
            };

            console.log('New Document Object:', newDocument);
            console.log('Current Documents (before):', student.documents);

            // Store in Map
            if (!student.documents || !(student.documents instanceof Map)) {
                console.log('Initializing new Map for documents');
                student.documents = new Map();
            }

            // Log before setting
            console.log(`Setting document type: ${documentType}`);
            student.documents.set(documentType, newDocument);

            student.markModified('documents');
            await student.save();
            console.log('Student saved successfully');

            res.status(200).json({
                success: true,
                message: 'File uploaded successfully',
                document: newDocument
            });

        } catch (error) {
            console.error('Upload handling error:', error);
            res.status(500).json({ success: false, message: 'Server error during upload' });
        }
    });
};

/**
 * Upload Batch Documents
 * POST /api/students/draft/:tempId/upload-batch
 */
exports.uploadBatchDocuments = (req, res) => {
    const batchUpload = multer({
        storage: storage,
        limits: { fileSize: 10 * 1024 * 1024 }, // Increased to 10MB
        fileFilter: (req, file, cb) => {
            const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
            const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
            const mimetype = allowedTypes.test(file.mimetype);
            if (extname && mimetype) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type'));
            }
        }
    }).any();

    batchUpload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        } else if (err) {
            console.error('Multer Middleware Error:', err);
            // Return 404 if specifically draft not found, else 400/500
            if (err.message === 'Student draft not found') {
                return res.status(404).json({ success: false, message: 'Student draft not found. Please refresh.' });
            }
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No files uploaded' });
            }

            const { tempId } = req.params;
            const student = await Student.findOne({ tempStudentId: tempId, isDraft: true });

            if (!student) {
                return res.status(404).json({ success: false, message: 'Draft not found' });
            }

            // Ensure documents is a Map
            if (!student.documents || !(student.documents instanceof Map)) {
                student.documents = new Map();
            }

            const uploadedDocuments = [];
            const errors = [];

            // Process each file
            for (const file of req.files) {
                const documentType = file.fieldname;

                // Specific Validation logic
                const isResume = documentType === 'resume';
                const isDegree = documentType === 'degree_certificate';
                const fileExt = path.extname(file.originalname).toLowerCase();

                if ((isResume || isDegree) && fileExt !== '.pdf') {
                    errors.push(`${isResume ? 'Resume' : 'Degree Certificate'} must be a PDF file.`);
                    // Clean up invalid file
                    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                    continue;
                }

                // Construct relative URL
                const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
                const fileUrl = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

                const newDocument = {
                    documentType,
                    documentName: file.originalname,
                    documentUrl: fileUrl,
                    verified: false
                };

                // Check if document of this type already exists in Map
                if (student.documents.has(documentType)) {
                    const existingDoc = student.documents.get(documentType);
                    // Check if existingDoc is object or string (handle legacy/mixed types)
                    const oldUrl = typeof existingDoc === 'string' ? existingDoc : existingDoc.documentUrl;

                    if (oldUrl) {
                        try {
                            const oldRelativePath = oldUrl.startsWith('/') ? oldUrl.substring(1) : oldUrl;
                            const oldFullPath = path.resolve(process.cwd(), oldRelativePath);

                            if (fs.existsSync(oldFullPath)) {
                                // Create temp dir inside the student's folder
                                const studentDir = path.dirname(oldFullPath);
                                const tempDir = path.join(studentDir, 'temp');

                                if (!fs.existsSync(tempDir)) {
                                    fs.mkdirSync(tempDir, { recursive: true });
                                }

                                // Move old file to temp
                                const oldFileName = path.basename(oldFullPath);
                                const targetPath = path.join(tempDir, `${Date.now()}_${oldFileName}`);

                                fs.renameSync(oldFullPath, targetPath);
                            }
                        } catch (moveErr) {
                            console.error(`Failed to move old ${documentType} to temp:`, moveErr);
                        }
                    }
                    // Remove old entry not strictly needed as set() prioritizes overwrite, but good for clarity
                    student.documents.delete(documentType);
                }

                // Store in Map
                student.documents.set(documentType, newDocument);
                uploadedDocuments.push(newDocument);
            }

            student.markModified('documents'); // Important for Map changes
            await student.save();

            res.status(200).json({
                success: true,
                message: 'Files uploaded successfully',
                documents: uploadedDocuments,
                errors: errors.length > 0 ? errors : undefined
            });
        } catch (error) {
            console.error('Batch upload error:', error);
            res.status(500).json({ success: false, message: 'Server error during batch upload', error: error.message });
        }
    });
};
