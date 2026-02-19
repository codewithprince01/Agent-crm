const fs = require('fs');
const path = require('path');

const UPLOADS_BASE = 'uploads/documents/agents';

/**
 * Sanitize string for filename/foldername
 */
const sanitize = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

/**
 * Move uploaded file to structured entity folder (Agent/Student)
 * @param {Object} file - Multer file object
 * @param {Object} entity - Agent or Student mongoose document
 * @param {String} documentKey - Document key (e.g. 'idProof', 'resume')
 * @param {String} subFolder - Subfolder name ('agents' or 'students')
 * @returns {String} relativePath - Path to store in DB
 */
const moveFileToEntityFolder = (file, entity, documentKey, subFolder = 'agents') => {
    const UPLOADS_BASE = `uploads/documents/${subFolder}`;

    // 1. Prepare folder name components
    const entityName = sanitize(entity.firstName + ' ' + entity.lastName);
    // Use email for folder name as requested (or fallback to ID if no email, though email should be there)
    const uniqueIdentifier = entity.email ? sanitize(entity.email) : entity._id.toString();

    // 2. Construct folder path
    const folderName = `${entityName}_${uniqueIdentifier}`;
    const targetDir = path.join(process.cwd(), UPLOADS_BASE, folderName);

    // 3. Create directory
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // 4. Construct filename
    const ext = path.extname(file.originalname);
    let finalFilename = file.originalname;

    if (documentKey) {
        finalFilename = `${sanitize(documentKey)}${ext}`;
    } else {
        finalFilename = sanitize(path.parse(file.originalname).name) + ext;
    }

    const targetPath = path.join(targetDir, finalFilename);

    // 5. Move file
    try {
        fs.renameSync(file.path, targetPath);
    } catch (err) {
        // Fallback for cross-device link
        fs.copyFileSync(file.path, targetPath);
        fs.unlinkSync(file.path);
    }

    // 6. Return relative path for DB
    return path.join(UPLOADS_BASE, folderName, finalFilename);
};

module.exports = {
    moveFileToEntityFolder,
    sanitize
};
