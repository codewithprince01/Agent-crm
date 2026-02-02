const jwt = require('jsonwebtoken');
const { User, Agent, Student } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { USER_ROLES, AGENT_APPROVAL_STATUS } = require('../utils/constants');

class AuthController {
  /**
   * Login
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({
        where: { email },
        include: [
          {
            model: Agent,
            as: 'agent',
            required: false,
          },
          {
            model: Student,
            as: 'student',
            required: false,
          },
        ],
      });

      if (!user) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'active') {
        return ResponseHandler.forbidden(res, 'Account is inactive');
      }

      // Check agent approval status
      if (user.role === USER_ROLES.AGENT && user.agent) {
        if (user.agent.approval_status !== AGENT_APPROVAL_STATUS.APPROVED) {
          return ResponseHandler.forbidden(
            res,
            `Agent account is ${user.agent.approval_status}. Please wait for admin approval.`
          );
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update last login
      await user.update({ last_login: new Date() });

      // Log audit
      await AuditService.logLogin(user, req);

      logger.info('User logged in', { userId: user.id, email: user.email });

      return ResponseHandler.success(res, 'Login successful', {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (error) {
      logger.error('Login error', { error: error.message });
      return ResponseHandler.serverError(res, 'Login failed', error);
    }
  }

  /**
   * Register Agent
   * POST /api/auth/register-agent
   */
  static async registerAgent(req, res) {
    try {
      const { name, email, phone, password, company_name, country, city, address } = req.body;

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
        role: USER_ROLES.AGENT,
        status: 'active',
      });

      // Create agent profile
      const agent = await Agent.create({
        user_id: user.id,
        company_name,
        country,
        city,
        address,
        approval_status: AGENT_APPROVAL_STATUS.PENDING,
      });

      // Send registration email
      await emailService.sendAgentRegistrationEmail(agent, user);

      // Log audit
      await AuditService.logCreate(user, 'Agent', agent.id, { email, company_name }, req);

      logger.info('Agent registered', { userId: user.id, agentId: agent.id });

      return ResponseHandler.created(res, 'Agent registration successful. Please wait for admin approval.', {
        userId: user.id,
        agentId: agent.id,
        approval_status: agent.approval_status,
      });
    } catch (error) {
      logger.error('Agent registration error', { error: error.message });
      return ResponseHandler.serverError(res, 'Registration failed', error);
    }
  }

  /**
   * Register Student
   * POST /api/auth/register-student
   */
  static async registerStudent(req, res) {
    try {
      const { name, email, phone, password, agent_id, date_of_birth, nationality, passport_number } = req.body;

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
        role: USER_ROLES.STUDENT,
        status: 'active',
      });

      // Create student profile
      const student = await Student.create({
        user_id: user.id,
        agent_id: agent_id || null,
        date_of_birth,
        nationality,
        passport_number,
      });

      logger.info('Student registered', { userId: user.id, studentId: student.id });

      // Generate token for auto-login
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return ResponseHandler.created(res, 'Student registration successful', {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      logger.error('Student registration error', { error: error.message });
      return ResponseHandler.serverError(res, 'Registration failed', error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  static async getMe(req, res) {
    try {
      const user = await User.findByPk(req.userId, {
        include: [
          {
            model: Agent,
            as: 'agent',
            required: false,
          },
          {
            model: Student,
            as: 'student',
            required: false,
          },
        ],
      });

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      return ResponseHandler.success(res, 'User retrieved successfully', { user });
    } catch (error) {
      logger.error('Get me error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get user', error);
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    try {
      // Log audit
      await AuditService.logLogout(req.user, req);

      logger.info('User logged out', { userId: req.userId });

      return ResponseHandler.success(res, 'Logout successful');
    } catch (error) {
      logger.error('Logout error', { error: error.message });
      return ResponseHandler.serverError(res, 'Logout failed', error);
    }
  }
}

module.exports = AuthController;
