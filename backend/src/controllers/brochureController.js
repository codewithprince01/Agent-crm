const { BrochureType, BrochureCategory, UniversityProgram, Brochure, AgentUniversityAssignment } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')  // Remove all non-word chars
        .replace(/--+/g, '-');    // Replace multiple - with single -
};

class BrochureController {
    // Brochure Types
    static async getAllBrochureTypes(req, res) {
        try {
            const types = await BrochureType.find().sort({ name: 1 });

            // Add University Program counts
            const typesWithCounts = await Promise.all(types.map(async (type) => {
                const count = await UniversityProgram.countDocuments({ brochure_type_id: type._id });
                return {
                    ...type.toObject(),
                    upCount: count
                };
            }));

            return ResponseHandler.success(res, 'Brochure types retrieved successfully', typesWithCounts);
        } catch (error) {
            logger.error('Get brochure types error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to get brochure types', error);
        }
    }

    static async createBrochureType(req, res) {
        try {
            const { name } = req.body;
            const type = await BrochureType.create({ name });
            return ResponseHandler.success(res, 'Brochure type created successfully', type);
        } catch (error) {
            logger.error('Create brochure type error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to create brochure type', error);
        }
    }

    static async updateBrochureType(req, res) {
        try {
            const { id } = req.params;
            const type = await BrochureType.findByIdAndUpdate(id, req.body, { new: true });
            return ResponseHandler.success(res, 'Brochure type updated successfully', type);
        } catch (error) {
            logger.error('Update brochure type error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to update brochure type', error);
        }
    }

    static async deleteBrochureType(req, res) {
        try {
            const { id } = req.params;

            // 1. Find all University Programs for this type
            const programs = await UniversityProgram.find({ brochure_type_id: id });

            for (const program of programs) {
                // 2. Find all brochures for each program to delete files
                const brochures = await Brochure.find({ university_program_id: program._id });

                for (const brochure of brochures) {
                    if (brochure.fileUrl) {
                        try {
                            const absolutePath = path.join(process.cwd(), 'uploads', brochure.fileUrl);
                            if (fs.existsSync(absolutePath)) {
                                fs.unlinkSync(absolutePath);

                                // Try to delete parent folders
                                const parentDir = path.dirname(absolutePath);
                                if (fs.readdirSync(parentDir).length === 0) {
                                    fs.rmdirSync(parentDir);
                                }

                                const grandParentDir = path.dirname(parentDir);
                                if (grandParentDir.includes(path.join('uploads', 'documents', 'brochure')) && fs.readdirSync(grandParentDir).length === 0) {
                                    fs.rmdirSync(grandParentDir);
                                }
                            }
                        } catch (fsError) {
                            logger.error('Error deleting brochure file during Type deletion', {
                                error: fsError.message,
                                fileUrl: brochure.fileUrl
                            });
                        }
                    }
                }

                // 3. Delete brochure records for the program
                await Brochure.deleteMany({ university_program_id: program._id });
            }

            // 4. Delete all University Program records for this type
            await UniversityProgram.deleteMany({ brochure_type_id: id });

            // 5. Delete the Brochure Type record itself
            await BrochureType.findByIdAndDelete(id);

            return ResponseHandler.success(res, 'Brochure type and all associated programs and brochures deleted successfully');
        } catch (error) {
            logger.error('Delete brochure type error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to delete brochure type', error);
        }
    }

    // Brochure Categories
    static async getAllCategories(req, res) {
        try {
            const categories = await BrochureCategory.find().populate('brochure_type_id').sort({ name: 1 });
            return ResponseHandler.success(res, 'Categories retrieved successfully', categories);
        } catch (error) {
            logger.error('Get categories error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to get categories', error);
        }
    }

    static async createCategory(req, res) {
        try {
            const category = await BrochureCategory.create(req.body);
            return ResponseHandler.success(res, 'Category created successfully', category);
        } catch (error) {
            logger.error('Create category error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to create category', error);
        }
    }

    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const category = await BrochureCategory.findByIdAndUpdate(id, req.body, { new: true });
            return ResponseHandler.success(res, 'Category updated successfully', category);
        } catch (error) {
            logger.error('Update category error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to update category', error);
        }
    }

    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            await BrochureCategory.findByIdAndDelete(id);
            return ResponseHandler.success(res, 'Category deleted successfully');
        } catch (error) {
            logger.error('Delete category error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to delete category', error);
        }
    }

    static async getUPById(req, res) {
        try {
            const up = await UniversityProgram.findById(req.params.id || req.params.upId)
                .populate('brochure_type_id');
            if (!up) {
                return ResponseHandler.notFound(res, 'University program not found');
            }
            return ResponseHandler.success(res, 'University program retrieved successfully', up);
        } catch (error) {
            logger.error('Get up by id error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to get university program', error);
        }
    }

    // University Programs (ups)
    static async getAllUniversityPrograms(req, res) {
        try {
            let query = {};
            if (req.userRole?.toUpperCase() === 'AGENT') {
                const assignedUPs = await AgentUniversityAssignment.find({ agentId: req.userId }).distinct('universityId');
                query._id = { $in: assignedUPs };
            }
            const ups = await UniversityProgram.find(query).populate('brochure_type_id').sort({ name: 1 });

            // Add brochure counts
            const upsWithCounts = await Promise.all(ups.map(async (up) => {
                const count = await Brochure.countDocuments({ university_program_id: up._id });
                return {
                    ...up.toObject(),
                    brochureCount: count
                };
            }));

            return ResponseHandler.success(res, 'University programs retrieved successfully', upsWithCounts);
        } catch (error) {
            logger.error('Get ups error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to get university programs', error);
        }
    }

    static async getUniversityProgramsByType(req, res) {
        try {
            const { typeId } = req.params;
            let query = { brochure_type_id: typeId };

            if (req.userRole?.toUpperCase() === 'AGENT') {
                const assignedUPs = await AgentUniversityAssignment.find({ agentId: req.userId }).distinct('universityId');
                query._id = { $in: assignedUPs };
            }

            const ups = await UniversityProgram.find(query).sort({ name: 1 });

            // Add brochure counts
            const upsWithCounts = await Promise.all(ups.map(async (up) => {
                const count = await Brochure.countDocuments({ university_program_id: up._id });
                return {
                    ...up.toObject(),
                    brochureCount: count
                };
            }));

            return ResponseHandler.success(res, 'University programs for type retrieved successfully', upsWithCounts);
        } catch (error) {
            logger.error('Get ups by type error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to get university programs', error);
        }
    }

    static async createUniversityProgram(req, res) {
        try {
            const up = await UniversityProgram.create(req.body);
            return ResponseHandler.success(res, 'University program created successfully', up);
        } catch (error) {
            logger.error('Create up error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to create university program', error);
        }
    }

    static async updateUniversityProgram(req, res) {
        try {
            const { id } = req.params;
            const up = await UniversityProgram.findByIdAndUpdate(id, req.body, { new: true });
            return ResponseHandler.success(res, 'University program updated successfully', up);
        } catch (error) {
            logger.error('Update up error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to update university program', error);
        }
    }

    static async deleteUniversityProgram(req, res) {
        try {
            const { id } = req.params;

            // Find all brochures for this UP to delete their files
            const brochures = await Brochure.find({ university_program_id: id });

            for (const brochure of brochures) {
                // Physically delete the file if it exists
                if (brochure.fileUrl) {
                    try {
                        const absolutePath = path.join(process.cwd(), 'uploads', brochure.fileUrl);
                        if (fs.existsSync(absolutePath)) {
                            fs.unlinkSync(absolutePath);

                            // Try to delete parent folders if empty
                            const parentDir = path.dirname(absolutePath);
                            if (fs.readdirSync(parentDir).length === 0) {
                                fs.rmdirSync(parentDir);
                            }

                            const grandParentDir = path.dirname(parentDir);
                            if (grandParentDir.includes(path.join('uploads', 'documents', 'brochure')) && fs.readdirSync(grandParentDir).length === 0) {
                                fs.rmdirSync(grandParentDir);
                            }
                        }
                    } catch (fsError) {
                        logger.error('Error deleting brochure file during UP deletion', {
                            error: fsError.message,
                            fileUrl: brochure.fileUrl
                        });
                    }
                }
            }

            // Delete brochure records
            await Brochure.deleteMany({ university_program_id: id });

            // Delete program record
            await UniversityProgram.findByIdAndDelete(id);

            return ResponseHandler.success(res, 'University program and all associated brochures deleted successfully');
        } catch (error) {
            logger.error('Delete up error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to delete university program', error);
        }
    }

    // Brochures
    static async getBrochuresByUP(req, res) {
        try {
            const { upId } = req.params;

            // Permission check for agents
            if (req.userRole?.toUpperCase() === 'AGENT') {
                const isAssigned = await AgentUniversityAssignment.findOne({
                    agentId: req.userId,
                    universityId: upId
                });
                if (!isAssigned) {
                    return ResponseHandler.forbidden(res, 'You are not assigned to this university program');
                }
            }

            const brochures = await Brochure.find({ university_program_id: upId }).populate('brochure_category_id');
            return ResponseHandler.success(res, 'Brochures retrieved successfully', brochures);
        } catch (error) {
            logger.error('Get brochures error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to get brochures', error);
        }
    }

    static async getDynamicStoragePath(upId, brochureTitle) {
        const up = await UniversityProgram.findById(upId);
        if (!up) return null;

        const universityName = up.name || 'University';
        const folderName = `${slugify(universityName)}_${slugify(brochureTitle)}`;

        // Path: documents/brochure/{university}_{brochureTitle}
        const relativePath = path.join('documents', 'brochure', folderName);
        const absolutePath = path.join(process.cwd(), 'uploads', relativePath);

        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true });
        }

        return {
            relativePath: `/${relativePath.replace(/\\/g, '/')}`,
            absolutePath
        };
    }

    static async createBrochure(req, res) {
        try {
            const { upId } = req.params;
            const brochureData = {
                ...req.body,
                university_program_id: upId,
                // Ensure brochure_category_id is set from category_id if needed
                brochure_category_id: req.body.brochure_category_id || req.body.category_id
            };

            console.log('Create Brochure Request:', {
                params: req.params,
                body: req.body,
                file: req.file ? {
                    filename: req.file.filename,
                    originalname: req.file.originalname,
                    path: req.file.path
                } : 'No file'
            });

            // If a file was uploaded, add the URL
            if (req.file) {
                const brochureTitle = brochureData.title || 'Brochure';
                const storageInfo = await BrochureController.getDynamicStoragePath(
                    upId,
                    brochureTitle
                );

                if (storageInfo) {
                    const extension = path.extname(req.file.originalname);
                    let baseFileName = slugify(brochureTitle);
                    let finalFileName = `${baseFileName}${extension}`;
                    let finalPath = path.join(storageInfo.absolutePath, finalFileName);

                    // Handle uniqueness
                    if (fs.existsSync(finalPath)) {
                        const timestamp = Math.floor(Date.now() / 1000);
                        finalFileName = `${baseFileName}_${timestamp}${extension}`;
                        finalPath = path.join(storageInfo.absolutePath, finalFileName);
                    }

                    fs.renameSync(req.file.path, finalPath);

                    const fileUrl = `${storageInfo.relativePath}/${finalFileName}`;
                    brochureData.fileUrl = fileUrl;
                    brochureData.name = finalFileName; // Store renamed filename
                    if (!brochureData.url) {
                        brochureData.url = fileUrl;
                    }
                } else {
                    // Fallback to temp if UP not found
                    const fileUrl = `/uploads/temp/${req.file.filename}`;
                    brochureData.fileUrl = fileUrl;
                    brochureData.name = req.file.filename;
                    if (!brochureData.url) {
                        brochureData.url = fileUrl;
                    }
                }
            }

            // Remove empty fields to avoid validation issues
            if (!brochureData.date) delete brochureData.date;

            console.log('Final Brochure Data to Save:', brochureData);

            const brochure = await Brochure.create(brochureData);

            // Populating category for the response
            const populatedBrochure = await Brochure.findById(brochure._id).populate('brochure_category_id');

            return ResponseHandler.success(res, 'Brochure created successfully', populatedBrochure);
        } catch (error) {
            console.error('Detailed Create Brochure Error:', error);
            logger.error('Create brochure error', { error: error.message, stack: error.stack });
            return ResponseHandler.serverError(res, `Failed to create brochure: ${error.message}`, error);
        }
    }
    static async updateBrochure(req, res) {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };

            // Fix field mapping
            if (req.body.category_id) {
                updateData.brochure_category_id = req.body.category_id;
            }

            if (req.file) {
                const existingBrochure = await Brochure.findById(id);
                if (!existingBrochure) return ResponseHandler.notFound(res, 'Brochure not found');

                const brochureTitle = updateData.title || existingBrochure.title || 'Brochure';
                const upId = existingBrochure.university_program_id;

                const storageInfo = await BrochureController.getDynamicStoragePath(
                    upId,
                    brochureTitle
                );

                if (storageInfo) {
                    const extension = path.extname(req.file.originalname);
                    let baseFileName = slugify(brochureTitle);
                    let finalFileName = `${baseFileName}${extension}`;
                    let finalPath = path.join(storageInfo.absolutePath, finalFileName);

                    // Handle uniqueness
                    if (fs.existsSync(finalPath)) {
                        const timestamp = Math.floor(Date.now() / 1000);
                        finalFileName = `${baseFileName}_${timestamp}${extension}`;
                        finalPath = path.join(storageInfo.absolutePath, finalFileName);
                    }

                    fs.renameSync(req.file.path, finalPath);

                    const fileUrl = `${storageInfo.relativePath}/${finalFileName}`;
                    updateData.fileUrl = fileUrl;
                    updateData.name = finalFileName;
                    if (!updateData.url) {
                        updateData.url = fileUrl;
                    }

                    // Optional: Clean up old file if name/path changed
                    if (existingBrochure.fileUrl && existingBrochure.fileUrl !== fileUrl) {
                        try {
                            const oldAbsolutePath = path.join(process.cwd(), 'uploads', existingBrochure.fileUrl);
                            if (fs.existsSync(oldAbsolutePath)) {
                                fs.unlinkSync(oldAbsolutePath);
                            }
                        } catch (err) {
                            logger.error('Error deleting old brochure file during update', { error: err.message });
                        }
                    }
                } else {
                    const fileUrl = `/uploads/temp/${req.file.filename}`;
                    updateData.fileUrl = fileUrl;
                    updateData.name = req.file.filename;
                    if (!updateData.url) {
                        updateData.url = fileUrl;
                    }
                }
            }

            const brochure = await Brochure.findByIdAndUpdate(id, updateData, { new: true }).populate('brochure_category_id');
            if (!brochure) {
                return ResponseHandler.notFound(res, 'Brochure not found');
            }

            return ResponseHandler.success(res, 'Brochure updated successfully', brochure);
        } catch (error) {
            logger.error('Update brochure error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to update brochure', error);
        }
    }


    static async deleteBrochure(req, res) {
        try {
            const { id } = req.params;
            const brochure = await Brochure.findById(id);

            if (!brochure) {
                return ResponseHandler.notFound(res, 'Brochure not found');
            }

            // Physically delete the file if it exists
            if (brochure.fileUrl) {
                try {
                    const absolutePath = path.join(process.cwd(), 'uploads', brochure.fileUrl);
                    if (fs.existsSync(absolutePath)) {
                        fs.unlinkSync(absolutePath);

                        // Also try to delete the parent folder (it might be the nested {filename} folder)
                        const parentDir = path.dirname(absolutePath);
                        if (fs.readdirSync(parentDir).length === 0) {
                            fs.rmdirSync(parentDir);
                        }

                        // And potentially the {type}_{name}_{date} folder if that's also empty
                        const grandParentDir = path.dirname(parentDir);
                        // Check if grandparent is still inside uploads/documents/brochure
                        if (grandParentDir.includes(path.join('uploads', 'documents', 'brochure')) && fs.readdirSync(grandParentDir).length === 0) {
                            fs.rmdirSync(grandParentDir);
                        }
                    }
                } catch (fsError) {
                    logger.error('Error deleting brochure file', {
                        error: fsError.message,
                        fileUrl: brochure.fileUrl
                    });
                }
            }

            await Brochure.findByIdAndDelete(id);
            return ResponseHandler.success(res, 'Brochure deleted successfully');
        } catch (error) {
            logger.error('Delete brochure error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to delete brochure', error);
        }
    }
}

module.exports = BrochureController;
