const { University } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class UniversityController {
  /**
   * Get all universities
   * GET /api/universities
   */
  static async getAllUniversities(req, res) {
    try {
      const { page = 1, limit = 10, search, country, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (country) where.country = country;
      if (search) {
        where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }];
      }

      const { count, rows } = await University.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.paginated(res, 'Universities retrieved successfully', rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
      });
    } catch (error) {
      logger.error('Get universities error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get universities', error);
    }
  }

  /**
   * Get university by ID
   * GET /api/universities/:id
   */
  static async getUniversityById(req, res) {
    try {
      const { id } = req.params;

      const university = await University.findByPk(id, {
        include: [
          {
            model: require('../models').Course,
            as: 'courses',
          },
        ],
      });

      if (!university) {
        return ResponseHandler.notFound(res, 'University not found');
      }

      return ResponseHandler.success(res, 'University retrieved successfully', { university });
    } catch (error) {
      logger.error('Get university error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get university', error);
    }
  }

  /**
   * Create university
   * POST /api/universities
   */
  static async createUniversity(req, res) {
    try {
      const { name, country, city, website, contact_email, contact_phone, agreement_status } = req.body;

      const university = await University.create({
        name,
        country,
        city,
        website,
        contact_email,
        contact_phone,
        agreement_status: agreement_status || 'pending',
        status: 'active',
      });

      await AuditService.logCreate(req.user, 'University', university.id, university.toJSON(), req);

      logger.info('University created', { universityId: university.id });

      return ResponseHandler.created(res, 'University created successfully', { university });
    } catch (error) {
      logger.error('Create university error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to create university', error);
    }
  }

  /**
   * Update university
   * PUT /api/universities/:id
   */
  static async updateUniversity(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const university = await University.findByPk(id);
      if (!university) {
        return ResponseHandler.notFound(res, 'University not found');
      }

      const oldValue = university.toJSON();
      await university.update(updateData);

      await AuditService.logUpdate(req.user, 'University', university.id, oldValue, university.toJSON(), req);

      logger.info('University updated', { universityId: id });

      return ResponseHandler.success(res, 'University updated successfully', { university });
    } catch (error) {
      logger.error('Update university error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to update university', error);
    }
  }

  /**
   * Delete university
   * DELETE /api/universities/:id
   */
  static async deleteUniversity(req, res) {
    try {
      const { id } = req.params;

      const university = await University.findByPk(id);
      if (!university) {
        return ResponseHandler.notFound(res, 'University not found');
      }

      await AuditService.logDelete(req.user, 'University', id, university.toJSON(), req);
      await university.destroy();

      logger.info('University deleted', { universityId: id });

      return ResponseHandler.success(res, 'University deleted successfully');
    } catch (error) {
      logger.error('Delete university error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to delete university', error);
    }
  }
}

module.exports = UniversityController;
