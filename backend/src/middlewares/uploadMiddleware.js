const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/settings';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Check if a custom name is provided in the request body
        // Note: customName must be appended to FormData BEFORE the file
        if (req.body.customName) {
            const customBaseName = req.body.customName;

            try {
                // To ensure true replacement even if extensions differ,
                // we search and delete any existing files starting with the custom name
                if (fs.existsSync(uploadDir)) {
                    const files = fs.readdirSync(uploadDir);
                    files.forEach(existingFile => {
                        // Match filename without extension
                        const baseName = path.parse(existingFile).name;
                        if (baseName === customBaseName) {
                            try {
                                fs.unlinkSync(path.join(uploadDir, existingFile));
                            } catch (err) {
                                console.error(`Failed to delete existing file: ${existingFile}`, err);
                            }
                        }
                    });
                }
            } catch (err) {
                console.error('Error during file cleanup in uploadMiddleware:', err);
            }

            const ext = path.extname(file.originalname);
            return cb(null, customBaseName + ext);
        }

        // Default unique filename: fieldname-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (Images only)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;
