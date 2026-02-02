const { Student, User, Agent, StudentDocument } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class StudentController {
  /**
   * Get all students
   * GET /api/students
   */
  static async getAllStudents(req, res) {
    try {
      const { page = 1, limit = 10, search, agent_id } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      
      // Role-based filtering
      if (req.userRole === 'AGENT') {
        where.agent_id = req.user.agent.id;
      } else if (agent_id) {
        where.agent_id = agent_id;
      }

      const userWhere = {};
      if (search) {
        userWhere[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Student.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
            attributes: { exclude: ['password'] },
          },
          {
            model: Agent,
            as: 'agent',
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.paginated(res, 'Students retrieved successfully', rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
      });
    } catch (error) {
      logger.error('Get students error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get students', error);
    }
  }

  /**
   * Get student by ID
   * GET /api/students/:id
   */
  static async getStudentById(req, res) {
    try {
      const { id } = req.params;

      const student = await Student.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: { exclude: ['password'] },
          },
          {
            model: Agent,
            as: 'agent',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
          },
          {
            model: StudentDocument,
            as: 'documents',
          },
        ],
      });

      if (!student) {
        return ResponseHandler.notFound(res, 'Student not found');
      }

      return ResponseHandler.success(res, 'Student retrieved successfully', { student });
    } catch (error) {
      logger.error('Get student error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get student', error);
    }
  }

  /**
   * Create student
   * POST /api/students
   */
  static async createStudent(req, res) {
    try {
      const {
        name,
        email,
        phone,
        password,
        date_of_birth,
        gender,
        nationality,
        passport_number,
        passport_expiry,
        address,
        city,
        country,
        postal_code,
        academic_level,
      } = req.body;

      // Get agent ID (from authenticated user if agent, or from body if admin)
      let agent_id = req.body.agent_id;
      if (req.userRole === 'AGENT') {
        agent_id = req.user.agent.id;
      }

      // Check if email exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return ResponseHandler.error(res, 'Email already exists');
      }

      // Create user
      const user = await User.create({
        name,
        email,
        phone,
        password,
        role: 'STUDENT',
        status: 'active',
      });

      // Create student
      const student = await Student.create({
        user_id: user.id,
        agent_id,
        date_of_birth,
        gender,
        nationality,
        passport_number,
        passport_expiry,
        address,
        city,
        country,
        postal_code,
        academic_level,
      });

      await AuditService.logCreate(req.user, 'Student', student.id, { email, agent_id }, req);

      logger.info('Student created', { studentId: student.id });

      return ResponseHandler.created(res, 'Student created successfully', { student });
    } catch (error) {
      logger.error('Create student error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to create student', error);
    }
  }

  /**
   * Update student
   * PUT /api/students/:id
   */
  static async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const student = await Student.findByPk(id);
      if (!student) {
        return ResponseHandler.notFound(res, 'Student not found');
      }

      // Authorization check
      if (req.userRole === 'AGENT' && student.agent_id !== req.user.agent.id) {
        return ResponseHandler.forbidden(res, 'Not authorized to update this student');
      }

      const oldValue = student.toJSON();
      await student.update(updateData);

      await AuditService.logUpdate(req.user, 'Student', student.id, oldValue, student.toJSON(), req);

      logger.info('Student updated', { studentId: id });

      return ResponseHandler.success(res, 'Student updated successfully', { student });
    } catch (error) {
      logger.error('Update student error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to update student', error);
    }
  }

  /**
   * Upload student document
   * POST /api/students/:id/documents
   */
  static async uploadDocument(req, res) {
    try {
      const { id } = req.params;
      const { document_type } = req.body;
      const file = req.file;

      if (!file) {
        return ResponseHandler.error(res, 'No file uploaded');
      }

      const student = await Student.findByPk(id);
      if (!student) {
        return ResponseHandler.notFound(res, 'Student not found');
      }

      const document = await StudentDocument.create({
        student_id: id,
        document_type,
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        verified: false,
      });

      await AuditService.logCreate(req.user, 'StudentDocument', document.id, { student_id: id, document_type }, req);

      logger.info('Student document uploaded', { studentId: id, documentId: document.id });

      return ResponseHandler.created(res, 'Document uploaded successfully', { document });
    } catch (error) {
      logger.error('Upload document error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to upload document', error);
    }
  }
}

module.exports = StudentController;
