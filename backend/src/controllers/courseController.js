const { Course, University } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class CourseController {
  /**
   * Get all courses
   * GET /api/courses
   */
  static async getAllCourses(req, res) {
    try {
      const { page = 1, limit = 10, search, university_id, level, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (university_id) where.university_id = university_id;
      if (level) where.level = level;
      if (status) where.status = status;
      if (search) {
        where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }];
      }

      const { count, rows } = await Course.findAndCountAll({
        where,
        include: [{ model: University, as: 'university' }],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.paginated(res, 'Courses retrieved successfully', rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
      });
    } catch (error) {
      logger.error('Get courses error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get courses', error);
    }
  }

  /**
   * Get course by ID
   * GET /api/courses/:id
   */
  static async getCourseById(req, res) {
    try {
      const { id } = req.params;

      const course = await Course.findByPk(id, {
        include: [{ model: University, as: 'university' }],
      });

      if (!course) {
        return ResponseHandler.notFound(res, 'Course not found');
      }

      return ResponseHandler.success(res, 'Course retrieved successfully', { course });
    } catch (error) {
      logger.error('Get course error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get course', error);
    }
  }

  /**
   * Create course
   * POST /api/courses
   */
  static async createCourse(req, res) {
    try {
      const {
        university_id,
        name,
        level,
        duration,
        tuition_fee,
        currency,
        intake_dates,
        eligibility,
        description,
      } = req.body;

      const course = await Course.create({
        university_id,
        name,
        level,
        duration,
        tuition_fee,
        currency: currency || 'USD',
        intake_dates,
        eligibility,
        description,
        status: 'active',
      });

      await AuditService.logCreate(req.user, 'Course', course.id, course.toJSON(), req);

      logger.info('Course created', { courseId: course.id });

      return ResponseHandler.created(res, 'Course created successfully', { course });
    } catch (error) {
      logger.error('Create course error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to create course', error);
    }
  }

  /**
   * Update course
   * PUT /api/courses/:id
   */
  static async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const course = await Course.findByPk(id);
      if (!course) {
        return ResponseHandler.notFound(res, 'Course not found');
      }

      const oldValue = course.toJSON();
      await course.update(updateData);

      await AuditService.logUpdate(req.user, 'Course', course.id, oldValue, course.toJSON(), req);

      logger.info('Course updated', { courseId: id });

      return ResponseHandler.success(res, 'Course updated successfully', { course });
    } catch (error) {
      logger.error('Update course error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to update course', error);
    }
  }

  /**
   * Delete course
   * DELETE /api/courses/:id
   */
  static async deleteCourse(req, res) {
    try {
      const { id } = req.params;

      const course = await Course.findByPk(id);
      if (!course) {
        return ResponseHandler.notFound(res, 'Course not found');
      }

      await AuditService.logDelete(req.user, 'Course', id, course.toJSON(), req);
      await course.destroy();

      logger.info('Course deleted', { courseId: id });

      return ResponseHandler.success(res, 'Course deleted successfully');
    } catch (error) {
      logger.error('Delete course error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to delete course', error);
    }
  }
}

module.exports = CourseController;
