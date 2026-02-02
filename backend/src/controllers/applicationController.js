const {
  Application,
  ApplicationStatusHistory,
  Student,
  Agent,
  University,
  Course,
  Commission,
  User,
} = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const CommissionService = require('../services/commissionService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { APPLICATION_STATUS, COMMISSION_STATUS } = require('../utils/constants');
const { Op } = require('sequelize');

class ApplicationController {
  /**
   * Create application
   * POST /api/applications
   */
  static async createApplication(req, res) {
    try {
      const { student_id, course_id, intake_date, notes } = req.body;

      // Get course with university
      const course = await Course.findByPk(course_id, {
        include: [{ model: University, as: 'university' }],
      });

      if (!course) {
        return ResponseHandler.notFound(res, 'Course not found');
      }

      // Get student with agent
      const student = await Student.findByPk(student_id, {
        include: [{ model: Agent, as: 'agent' }],
      });

      if (!student) {
        return ResponseHandler.notFound(res, 'Student not found');
      }

      // Authorize: Only the student's agent or admin can create application
      const isAuthorized =
        req.userRole === 'AGENT' && student.agent_id === req.user.agent.id ||
        ['ADMIN', 'SUPER_ADMIN'].includes(req.userRole);

      if (!isAuthorized) {
        return ResponseHandler.forbidden(res, 'Not authorized to create application for this student');
      }

      // Generate application number
      const appNumber = `APP-${Date.now()}-${student_id}`;

      // Create application
      const application = await Application.create({
        application_number: appNumber,
        student_id,
        agent_id: student.agent_id,
        university_id: course.university_id,
        course_id,
        status: APPLICATION_STATUS.DRAFT,
        intake_date,
        notes,
      });

      // Log audit
      await AuditService.logCreate(req.user, 'Application', application.id, application.toJSON(), req);

      logger.info('Application created', { applicationId: application.id, studentId: student_id });

      return ResponseHandler.created(res, 'Application created successfully', { application });
    } catch (error) {
      logger.error('Create application error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to create application', error);
    }
  }

  /**
   * Get all applications
   * GET /api/applications
   */
  static async getAllApplications(req, res) {
    try {
      const { page = 1, limit = 10, status, agent_id, university_id, student_id } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (agent_id) where.agent_id = agent_id;
      if (university_id) where.university_id = university_id;
      if (student_id) where.student_id = student_id;

      // Role-based filtering
      if (req.userRole === 'AGENT') {
        where.agent_id = req.user.agent.id;
      } else if (req.userRole === 'STUDENT') {
        where.student_id = req.user.student.id;
      }

      const { count, rows } = await Application.findAndCountAll({
        where,
        include: [
          {
            model: Student,
            as: 'student',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
          },
          {
            model: Agent,
            as: 'agent',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
          },
          { model: University, as: 'university' },
          { model: Course, as: 'course' },
          {
            model: Commission,
            as: 'commission',
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.paginated(res, 'Applications retrieved successfully', rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
      });
    } catch (error) {
      logger.error('Get applications error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get applications',error);
    }
  }

  /**
   * Get application by ID
   * GET /api/applications/:id
   */
  static async getApplicationById(req, res) {
    try {
      const { id } = req.params;

      const application = await Application.findByPk(id, {
        include: [
          {
            model: Student,
            as: 'student',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
          },
          {
            model: Agent,
            as: 'agent',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
          },
          { model: University, as: 'university' },
          { model: Course, as: 'course' },
          {
            model: Commission,
            as: 'commission',
          },
          {
            model: ApplicationStatusHistory,
            as: 'statusHistory',
            include: [{ model: User, as: 'changedBy', attributes: ['id', 'name'] }],
            order: [['changed_at', 'DESC']],
          },
        ],
      });

      if (!application) {
        return ResponseHandler.notFound(res, 'Application not found');
      }

      return ResponseHandler.success(res, 'Application retrieved successfully', { application });
    } catch (error) {
      logger.error('Get application error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get application', error);
    }
  }

  /**
   * Update application status
   * PUT /api/applications/:id/status
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const application = await Application.findByPk(id, {
        include: [
          { model: Student, as: 'student', include: [{ model: User, as: 'user' }] },
          { model: Course, as: 'course' },
          { model: University, as: 'university' },
        ],
      });

      if (!application) {
        return ResponseHandler.notFound(res, 'Application not found');
      }

      const oldStatus = application.status;

      // Update application status
      await application.update({ status });

      // Create status history
      await ApplicationStatusHistory.create({
        application_id: id,
        old_status: oldStatus,
        new_status: status,
        changed_by: req.userId,
        notes,
      });

      // Handle status-specific logic
      if (status === APPLICATION_STATUS.SUBMITTED) {
        await application.update({ submitted_at: new Date() });
      } else if (status === APPLICATION_STATUS.ENROLLED) {
        await application.update({ enrolled_at: new Date() });

        // Calculate and create commission
        const commissionData = await CommissionService.calculateCommission(
          application.agent_id,
          application.course_id,
          application.university_id,
          application.course.tuition_fee
        );

        if (commissionData.commissionAmount > 0) {
          await Commission.create({
            application_id: application.id,
            agent_id: application.agent_id,
            commission_rule_id: commissionData.ruleId,
            base_amount: application.course.tuition_fee,
            commission_amount: commissionData.commissionAmount,
            commission_type: commissionData.commissionType,
            commission_value: commissionData.commissionValue,
            status: COMMISSION_STATUS.PENDING,
          });
        }
      } else if (status === APPLICATION_STATUS.REJECTED) {
        await application.update({ rejected_at: new Date() });
      }

      // Send email notification
      await emailService.sendApplicationStatusEmail(application, application.student, application.student.user, status);

      // Log audit
      await AuditService.logStatusChange(req.user, 'Application', application.id, oldStatus, status, req);

      logger.info('Application status updated', { applicationId: id, oldStatus, newStatus: status });

      return ResponseHandler.success(res, 'Application status updated successfully', {
        application: await application.reload(),
      });
    } catch (error) {
      logger.error('Update application status error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to update application status', error);
    }
  }

  /**
   * Get application status history
   * GET /api/applications/::id/history
   */
  static async getStatusHistory(req, res) {
    try {
      const { id } = req.params;

      const history = await ApplicationStatusHistory.findAll({
        where: { application_id: id },
        include: [
          {
            model: User,
            as: 'changedBy',
            attributes: ['id', 'name', 'email', 'role'],
          },
        ],
        order: [['changed_at', 'DESC']],
      });

      return ResponseHandler.success(res, 'Status history retrieved successfully', { history });
    } catch (error) {
      logger.error('Get status history error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get status history', error);
    }
  }
}

module.exports = ApplicationController;
