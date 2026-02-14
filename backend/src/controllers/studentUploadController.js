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

            // Folder: FirstName_LastName_TempId (Stable)
            const safeName = `${student.firstName}_${student.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
            const folderName = `${safeName}_${student.tempStudentId}`;

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
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const { tempId } = req.params;
            const { documentType, documentName } = req.body;

            const student = await Student.findOne({ tempStudentId: tempId, isDraft: true });
            if (!student) {
                return res.status(404).json({ success: false, message: 'Draft not found' });
            }

            // Construct relative URL for frontend
            // Path stored: uploads/documents/students/Folder/File
            // URL should differ based on how static files are served.
            // Assuming 'uploads' is served statically.
            const relativePath = req.file.path.replace(process.cwd(), '').replace(/\\/g, '/');
            // Ensure leading slash
            const fileUrl = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

            const newDocument = {
                documentType,
                documentName: documentName || file.originalname,
                documentUrl: fileUrl,
                verified: false
            };

            // Check if document of this type already exists, replace it?
            // Requirements: "Option to replace uploaded file"
            // If it's a unique type like 'passport' or 'photo', replace.
            // If 'degree', might allow multiple (handled by frontend calling this multiple times with different types/names?)

            // For now, let's just push to array. Frontend logic can handle display/replacement UI.
            // Backend just specifically needs to know if we overwrite or append.
            // Let's filter out existing doc of same type if it's a single-file type.

            const singleFileTypes = ['photo', 'id_proof', 'resume', 'marksheet_10', 'marksheet_12'];

            if (singleFileTypes.includes(documentType)) {
                student.documents = student.documents.filter(doc => doc.documentType !== documentType);
            }

            student.documents.push(newDocument);
            await student.save();

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
exports.uploadBatchDocuments = [
    multer({
        storage: storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
        // We use a custom file filter here or just allow all and validate in the handler
        // Let's validate in the handler for batch upload to give specific error per file if needed
        // Or usage a generic filter that allows all safe types, and refine in handler.
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
    }).any(),
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No files uploaded' });
            }

            const { tempId } = req.params;
            const student = await Student.findOne({ tempStudentId: tempId, isDraft: true });

            if (!student) {
                return res.status(404).json({ success: false, message: 'Draft not found' });
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
                    errors.push(`${isResume ? 'Resume' : 'Degree Certificate'} must be a PDF file. Invalid file: ${file.originalname}`);
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

                // Check if document of this type already exists
                const existingDoc = student.documents.find(d => d.documentType === documentType);

                if (existingDoc && existingDoc.documentUrl) {
                    try {
                        // Construct full path of existing file
                        // url: /uploads/documents/students/Folder/File
                        // cwd: /.../backend
                        // We need to resolve it relative to CWD
                        const oldRelativePath = existingDoc.documentUrl.startsWith('/') ? existingDoc.documentUrl.substring(1) : existingDoc.documentUrl;
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
                            const targetPath = path.join(tempDir, oldFileName);

                            // Rename (Move)
                            fs.renameSync(oldFullPath, targetPath);
                            console.log(`Moved old ${documentType} to temp: ${targetPath}`);
                        }
                    } catch (moveErr) {
                        console.error(`Failed to move old ${documentType} to temp:`, moveErr);
                        // Continue anyway, don't block upload
                    }

                    // Remove from array
                    student.documents = student.documents.filter(doc => doc.documentType !== documentType);
                }

                student.documents.push(newDocument);
                uploadedDocuments.push(newDocument);
            }

            await student.save();

            if (errors.length > 0) {
                // return success but with warning messages if some files failed? 
                // Or fail if critical? 
                // For now, let's return combined status.
                return res.status(200).json({
                    success: true,
                    message: 'Upload processing complete',
                    documents: uploadedDocuments,
                    errors: errors // Frontend can display these
                });
            }

            res.status(200).json({
                success: true,
                message: 'Files uploaded successfully',
                documents: uploadedDocuments
            });
        } catch (error) {
            console.error('Batch upload error:', error);
            res.status(500).json({ success: false, message: 'Server error during batch upload' });
        }
    }
];
