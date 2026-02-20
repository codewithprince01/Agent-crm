const jwt = require('jsonwebtoken');
const { User, Agent, Student } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { USER_ROLES, AGENT_APPROVAL_STATUS } = require('../utils/constants');

class AuthController {
  /**
   * Login (Admin/Super Admin/Student only)
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password, role } = req.body;
      console.log(`Login attempt for: ${email}, requested role: ${role}`); // DEBUG LOG

      // Find user (Admin/Super Admin only)
      const user = await User.findOne({ email });


      if (!user) {
        console.log('User not found in DB'); // DEBUG LOG
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }
      console.log(`User found: ${user.email}, Role in DB: ${user.role}`); // DEBUG LOG

      // Validate role matches (if role is provided)
      if (role && user.role !== role) {
        // Allow "Super Admin" to match "SUPER_ADMIN"
        const normalize = (r) => r.toUpperCase().replace(/\s+/g, '_');
        if (normalize(user.role) !== normalize(role)) {
          console.log(`Role mismatch! Requested: ${role}, Actual: ${user.role}`); // DEBUG LOG
          return ResponseHandler.forbidden(
            res,
            `You are not authorized to login as ${role}. Your account role is ${user.role}.`
          );
        }
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        console.log('Password invalid'); // DEBUG LOG
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Check if user is active
      if (user.status !== 'active') {
        return ResponseHandler.forbidden(res, 'Account is inactive');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Log audit
      await AuditService.logLogin(user, req);

      logger.info('User logged in', { userId: user.id, email: user.email, role: user.role });

      return ResponseHandler.success(res, 'Welcome back! You have successfully logged in.', {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status,
        },
      });
    } catch (error) {
      logger.error('Login error', { error: error.message });
      return ResponseHandler.serverError(res, 'Login failed', error);
    }
  }

  /**
   * Agent Login (separate from users)
   * POST /api/auth/agent-login
   */
  static async agentLogin(req, res) {
    try {
      const { email, password } = req.body;
      console.log(`Agent login attempt for: ${email}`);

      // Find agent by email
      const agent = await Agent.findOne({ email });

      if (!agent) {
        console.log('Agent not found in DB');
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }
      console.log(`Agent found: ${agent.email}, Approval: ${agent.approvalStatus}`);

      // Check password
      const isPasswordValid = await agent.comparePassword(password);
      if (!isPasswordValid) {
        console.log('Password invalid');
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Check if agent is active
      if (agent.status !== 'active') {
        return ResponseHandler.forbidden(res, 'Account is inactive');
      }

      // Check agent approval status
      if (agent.approvalStatus !== AGENT_APPROVAL_STATUS.APPROVED) {
        return ResponseHandler.forbidden(
          res,
          `Agent account is ${agent.approvalStatus}. Please wait for admin approval.`
        );
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: agent._id,
          email: agent.email,
          role: 'AGENT', // Fixed role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update last login
      agent.lastLogin = new Date();
      await agent.save();

      // Log audit
      await AuditService.logLogin(agent, req, 'Agent');

      logger.info('Agent logged in', { agentId: agent.id, email: agent.email });

      return ResponseHandler.success(res, 'Welcome! You have successfully logged in as an agent.', {
        token,
        user: {
          id: agent._id,
          name: `${agent.firstName} ${agent.lastName}`, // Construct full name
          email: agent.email,
          role: 'AGENT',
          phone: agent.phone,
          status: agent.status,
          companyName: agent.companyName,
          approvalStatus: agent.approvalStatus,
        },
      });
    } catch (error) {
      logger.error('Agent login error', { error: error.message });
      return ResponseHandler.serverError(res, 'Login failed', error);
    }
  }

  /**
   * Register Agent
   * POST /api/auth/register-agent
   */
  static async registerAgent(req, res) {
    const fs = require('fs');
    const path = require('path');

    try {
      const {
        name,
        email,
        phone,
        password,
        company_name,
        company_address,
        contact_person,
        country,
        city,
        years_of_experience,
        description,
        bank_name,
        account_number,
        account_holder_name,
        ifsc_code,
        swift_code,
        website, // Added field
        registration_number // Added field (snake_case from frontend likely, or need to standardize)
      } = req.body;

      // Note: Frontend likely sends 'companyRegistrationNumber' or similar. 
      // User requirement: "Company Registration Number" and "Website Link" required.
      // We should check if these are present in body (express-validator checked some, ensuring here too if needed or mapping).

      const files = req.files;
      // Strict requirement: All documents mandatory for public registration
      // We can relax "All" to "At least ID/Company Proof" or strictly ALL.
      // User said: "Public Registration -> All fields + all documents strictly required."
      // Let's enforce presence of files.
      if (!files || Object.keys(files).length === 0) {
        return ResponseHandler.badRequest(res, 'All documents are required for registration.');
      }

      // Check for specific required documents if needed:
      // const requiredDocs = ['idProof', 'companyLicence', 'agentPhoto', 'identityDocument', 'companyRegistration', 'resume', 'companyPhoto'];
      // const missingDocs = requiredDocs.filter(doc => !files[doc]);
      // if (missingDocs.length > 0) {
      //   return ResponseHandler.badRequest(res, `Missing documents: ${missingDocs.join(', ')}`);
      // }

      // Check if email exists
      const existingAgent = await Agent.findOne({ email });
      if (existingAgent) {
        // Cleanup files
        Object.values(files).flat().forEach(file => { try { fs.unlinkSync(file.path); } catch (e) { } });
        return ResponseHandler.error(res, 'Email already exists', 400);
      }

      // Create agent first to get ID
      const agent = await Agent.create({
        name,
        email,
        phone,
        password,
        company_name,
        company_address,
        contact_person,
        country,
        city,
        years_of_experience,
        description,
        bank_name,
        account_number,
        account_holder_name,
        ifsc_code,
        swift_code,
        website,
        registrationNumber: registration_number, // Map snake_case to model field camelCase
        status: 'inactive',
        approvalStatus: AGENT_APPROVAL_STATUS.PENDING,
      });

      // Handle Documents
      // const documentsBaseDir = path.join(__dirname, '../../uploads/documents/agent');
      const documentsBaseDir = path.join(__dirname, '../../uploads/documents/agents');
      const safeName = (agent.name).replace(/[^a-z0-9]/gi, '');
      const dateStr = agent.createdAt ? new Date(agent.createdAt).getTime() : Date.now();
      const folderName = `${safeName}_${agent._id}_${dateStr}`;
      const agentFolder = path.join(documentsBaseDir, folderName);

      if (!fs.existsSync(agentFolder)) {
        fs.mkdirSync(agentFolder, { recursive: true });
      }

      const documentPaths = new Map();

      for (const [fieldName, fileArray] of Object.entries(files)) {
        const file = fileArray[0];
        const ext = path.extname(file.originalname);
        const newFileName = `${fieldName}${ext}`;
        const targetPath = path.join(agentFolder, newFileName);

        try {
          fs.renameSync(file.path, targetPath);
        } catch (err) {
          fs.copyFileSync(file.path, targetPath);
          fs.unlinkSync(file.path);
        }

        // const relativePath = `uploads/documents/agent/${folderName}/${newFileName}`;
        const relativePath = `uploads/documents/agents/${folderName}/${newFileName}`;

        documentPaths.set(fieldName, relativePath);
      }

      agent.documents = documentPaths;
      await agent.save();

      // Send registration email
      await emailService.sendAgentRegistrationEmail(agent);

      // Log audit
      await AuditService.logCreate(null, 'Agent', agent._id, {
        agentName: agent.name,
        email: agent.email,
        description: 'Self-registration with documents'
      }, req);

      logger.info('Agent registered', { agentId: agent.id, email: agent.email });

      return ResponseHandler.created(
        res,
        'Agent registration successful. Please wait for admin approval.',
        {
          agentId: agent.id,
          email: agent.email,
          approvalStatus: agent.approvalStatus,
        }
      );
    } catch (error) {
      // Cleanup files
      if (req.files) {
        Object.values(req.files).flat().forEach(file => { try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) { } });
      }
      logger.error('Agent registration error', { error: error.message });
      return ResponseHandler.serverError(res, 'Registration failed', error);
    }
  }

  /**
   * Register Student
   * POST /api/auth/register-student
   */
  /**
   * Register Student (Public)
   * POST /api/auth/register-student
   */
  static async registerStudent(req, res) {
    try {
      const { name, email, phone, agent_id, date_of_birth, nationality, passport_number } = req.body;

      // Check if email exists
      const existingStudent = await Student.findOne({ email: email.toLowerCase() });
      if (existingStudent) {
        return ResponseHandler.error(res, 'Email already exists', 400);
      }

      // Generate setup token (expires in 24 hours)
      const crypto = require('crypto');
      const setupToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create student
      const student = await Student.create({
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        email: email.toLowerCase(),
        phone,
        agentId: agent_id || null,
        dateOfBirth: date_of_birth,
        nationality,
        passportNumber: passport_number,
        status: 'active',
        isCompleted: true, // If they reach here from public form
        passwordSetupToken: setupToken,
        passwordSetupExpires: tokenExpires,
        isPasswordSet: false
      });

      // Send welcome email with setup link
      await emailService.sendStudentWelcomeEmail(student, setupToken);

      // Log audit
      await AuditService.logCreate(null, 'Student', student._id, {
        studentName: `${student.firstName} ${student.lastName}`,
        email: student.email,
        description: 'Self-registration'
      }, req);

      logger.info('Student registered via public URL', { studentId: student._id, email: student.email });

      return ResponseHandler.created(res, 'Registration successful. Please check your email to set your password.', {
        studentId: student._id,
        email: student.email
      });
    } catch (error) {
      logger.error('Student registration error', { error: error.message });
      return ResponseHandler.serverError(res, 'Registration failed', error);
    }
  }

  /**
   * Student Login
   * POST /api/auth/student-login
   */
  static async studentLogin(req, res) {
    try {
      const { email, password } = req.body;

      const student = await Student.findOne({ email: email.toLowerCase(), isCompleted: true });

      if (!student) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      if (!student.isPasswordSet) {
        return ResponseHandler.forbidden(res, 'Please set your password using the link sent to your email.');
      }

      const isPasswordValid = await student.comparePassword(password);
      if (!isPasswordValid) {
        return ResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      if (student.status !== 'active') {
        return ResponseHandler.forbidden(res, 'Account is inactive');
      }

      const token = jwt.sign(
        { id: student._id, email: student.email, role: 'STUDENT' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      student.lastLogin = new Date();
      await student.save();

      // Log audit
      await AuditService.logLogin(student, req, 'Student');

      return ResponseHandler.success(res, 'Welcome back! You have successfully logged in.', {
        token,
        user: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          role: 'STUDENT',
          status: student.status
        }
      });
    } catch (error) {
      logger.error('Student login error', { error: error.message });
      return ResponseHandler.serverError(res, 'Login failed', error);
    }
  }

  /**
   * Setup Student Password
   * POST /api/auth/student/setup-password
   */
  static async studentSetupPassword(req, res) {
    try {
      const { token, password } = req.body;

      const student = await Student.findOne({
        passwordSetupToken: token,
        passwordSetupExpires: { $gt: Date.now() }
      });

      if (!student) {
        return ResponseHandler.badRequest(res, 'Invalid or expired setup link');
      }

      student.password = password; // Will be hashed by pre-save
      student.isPasswordSet = true;
      student.passwordSetupToken = undefined;
      student.passwordSetupExpires = undefined;

      await student.save();

      // Log audit
      await AuditService.log({
        action: 'UPDATE',
        entityType: 'Student',
        entityId: student._id,
        description: 'Password setup completed',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        studentId: student._id,
        userName: `${student.firstName} ${student.lastName}`,
        userRole: 'STUDENT'
      });

      logger.info('Student password setup complete', { studentId: student._id });

      return ResponseHandler.success(res, 'Password set successfully. You can now login.');
    } catch (error) {
      logger.error('Student setup password error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to setup password', error);
    }
  }

  /**
   * Student Forgot Password (Send OTP)
   * POST /api/auth/student/forgot-password
   */
  static async studentForgotPassword(req, res) {
    try {
      const { email } = req.body;
      const student = await Student.findOne({ email: email.toLowerCase(), isCompleted: true });

      if (!student) {
        // Silent fail for security
        return ResponseHandler.success(res, 'If your email is registered, you will receive an OTP.');
      }

      // Generate 6-digit OTP
      const { generateOTP } = require('../utils/otpGenerator');
      const otp = generateOTP();

      student.passwordResetOTP = otp;
      student.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 mins

      await student.save();

      await emailService.sendStudentPasswordResetOTP(student, otp);

      return ResponseHandler.success(res, 'OTP sent successfully.');
    } catch (error) {
      logger.error('Student forgot password error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to process request', error);
    }
  }

  /**
   * Verify Student OTP
   * POST /api/auth/student/verify-otp
   */
  static async studentVerifyOTP(req, res) {
    try {
      const { email, otp } = req.body;
      const student = await Student.findOne({
        email: email.toLowerCase(),
        passwordResetOTP: otp,
        passwordResetOTPExpires: { $gt: Date.now() }
      });

      if (!student) {
        return ResponseHandler.badRequest(res, 'Invalid or expired OTP');
      }

      // Generate reset token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');

      student.passwordResetToken = resetToken;
      student.passwordResetExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
      student.passwordResetOTP = undefined;
      student.passwordResetOTPExpires = undefined;

      await student.save();

      return ResponseHandler.success(res, 'OTP verified', { resetToken });
    } catch (error) {
      logger.error('Student verify OTP error', { error: error.message });
      return ResponseHandler.serverError(res, 'Verification failed', error);
    }
  }

  /**
   * Student Reset Password (via Token)
   * POST /api/auth/student/reset-password
   */
  static async studentResetPassword(req, res) {
    try {
      const { token, password } = req.body;

      const student = await Student.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!student) {
        return ResponseHandler.badRequest(res, 'Invalid or expired reset token');
      }

      student.password = password;
      student.passwordResetToken = undefined;
      student.passwordResetExpires = undefined;
      student.isPasswordSet = true; // In case they reset before setup (though unlikely)

      await student.save();

      // Log audit
      await AuditService.log({
        action: 'UPDATE',
        entityType: 'Student',
        entityId: student._id,
        description: 'Password reset successful',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        studentId: student._id,
        userName: `${student.firstName} ${student.lastName}`,
        userRole: 'STUDENT'
      });

      await emailService.sendStudentPasswordResetSuccess(student);

      return ResponseHandler.success(res, 'Password reset successful.');
    } catch (error) {
      logger.error('Student reset password error', { error: error.message });
      return ResponseHandler.serverError(res, 'Reset failed', error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  static async getMe(req, res) {
    try {
      const user = await User.findById(req.userId).select('-password');

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      return ResponseHandler.success(res, 'Profile retrieved successfully', { user });
    } catch (error) {
      logger.error('Get me error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get profile', error);
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    try {
      // Log audit
      const userType = req.userRole === 'AGENT' ? 'Agent' : (req.userRole === 'STUDENT' ? 'Student' : 'User');
      await AuditService.logLogout(req.user, req, userType);

      logger.info('User logged out', { userId: req.userId });

      return ResponseHandler.success(res, 'You have been successfully logged out. See you soon!');
    } catch (error) {
      logger.error('Logout error', { error: error.message });
      return ResponseHandler.serverError(res, 'Logout failed', error);
    }
  }

  /**
   * Setup Password (First-time)
   * POST /api/auth/setup-password
   */
  static async setupPassword(req, res) {
    try {
      const { token, password, confirmPassword } = req.body;

      // Validate inputs
      if (!token || !password || !confirmPassword) {
        return ResponseHandler.badRequest(res, 'Token and password are required');
      }

      if (password !== confirmPassword) {
        return ResponseHandler.badRequest(res, 'Passwords do not match');
      }

      // Validate password strength
      const { validatePassword } = require('../utils/passwordValidator');
      const validation = validatePassword(password);
      if (!validation.isValid) {
        return ResponseHandler.badRequest(res, validation.errors.join(', '));
      }

      // Find agent by token
      const agent = await Agent.findOne({
        passwordSetupToken: token,
        passwordSetupExpires: { $gt: Date.now() }
      });

      if (!agent) {
        return ResponseHandler.badRequest(res, 'Invalid or expired token');
      }

      // Check if password already set
      if (agent.isPasswordSet) {
        return ResponseHandler.badRequest(res, 'Password already set. Use forgot password to reset.');
      }

      // Set password (will be hashed by pre-save hook)
      agent.password = password;
      agent.isPasswordSet = true;
      agent.passwordSetupToken = undefined;
      agent.passwordSetupExpires = undefined;
      agent.status = 'active';

      await agent.save();

      // Log audit
      await AuditService.log({
        action: 'UPDATE',
        entityType: 'Agent',
        entityId: agent._id,
        description: 'Password setup completed',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        agentId: agent._id,
        agentName: agent.name,
        userRole: 'AGENT'
      });

      logger.info('Password setup completed', { agentId: agent._id, email: agent.email });

      return ResponseHandler.success(res, 'Password set successfully. You can now login.');
    } catch (error) {
      logger.error('Setup password error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to setup password', error);
    }
  }

  /**
   * Forgot Password - Send OTP (Role-based routing)
   * POST /api/auth/forgot-password
   * Body: { email, role }
   */
  static async forgotPassword(req, res) {
    try {
      const { email, role } = req.body;

      if (!email) {
        return ResponseHandler.badRequest(res, 'Email is required');
      }

      if (!role) {
        return ResponseHandler.badRequest(res, 'Role is required');
      }

      let user = null;
      let tableName = '';

      // Route to correct table based on role
      if (role === 'STUDENT') {
        user = await Student.findOne({ email: email.toLowerCase(), isCompleted: true });
        tableName = 'Student';
      } else if (role === 'AGENT') {
        user = await Agent.findOne({ email: email.toLowerCase() });
        tableName = 'Agent';
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        user = await User.findOne({ email: email.toLowerCase(), role });
        tableName = 'User';
      } else {
        return ResponseHandler.badRequest(res, 'Invalid role');
      }

      // Don't reveal if email exists (security)
      if (!user) {
        return ResponseHandler.success(res, 'If the email exists, an OTP has been sent');
      }

      // Check if password is set (for Agent/Student)
      if ((role === 'AGENT' || role === 'STUDENT') && !user.isPasswordSet) {
        // Password not set yet - resend setup link instead of OTP
        const crypto = require('crypto');

        // Generate new password setup token (expires in 24 hours)
        const setupToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with new token
        user.passwordSetupToken = setupToken;
        user.passwordSetupExpires = tokenExpires;
        await user.save();

        // Send password setup email
        const maxRetries = 3;
        let attempt = 0;
        let emailSent = false;
        let lastError = null;

        while (attempt < maxRetries && !emailSent) {
          attempt++;
          try {
            if (role === 'STUDENT') {
              await emailService.sendStudentWelcomeEmail(user, setupToken);
            } else {
              await emailService.sendPasswordSetupEmail(user, setupToken);
            }
            emailSent = true;
            logger.info('Password setup link resent', {
              userId: user._id,
              email: user.email,
              role,
              attempt
            });
          } catch (emailError) {
            lastError = emailError;
            logger.error(`Failed to send setup email - Attempt ${attempt}/${maxRetries}`, {
              userId: user._id,
              error: emailError.message
            });

            if (attempt < maxRetries) {
              const waitTime = Math.pow(2, attempt) * 500;
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }

        if (!emailSent) {
          logger.error('All setup email send attempts failed', {
            userId: user._id,
            error: lastError?.message
          });
          return ResponseHandler.serverError(res, 'Failed to send setup link. Please contact support.');
        }

        return ResponseHandler.success(res, 'Password setup link has been sent to your email (valid for 24 hours)');
      }

      // Generate OTP
      const { generateOTP } = require('../utils/otpGenerator');
      const otp = generateOTP();

      // Save OTP with 10 minute expiry
      user.passwordResetOTP = otp;
      user.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      // Send OTP email with retry mechanism
      const maxRetries = 3;
      let attempt = 0;
      let emailSent = false;
      let lastError = null;

      while (attempt < maxRetries && !emailSent) {
        attempt++;
        try {
          if (role === 'STUDENT') {
            await emailService.sendStudentPasswordResetOTP(user, otp);
          } else {
            await emailService.sendPasswordResetOTP(user, otp);
          }
          emailSent = true;
          logger.info('Password reset OTP sent', {
            userId: user._id,
            email: user.email,
            role,
            tableName,
            attempt
          });
        } catch (emailError) {
          lastError = emailError;
          logger.error(`Failed to send OTP email - Attempt ${attempt}/${maxRetries}`, {
            userId: user._id,
            error: emailError.message
          });

          // If not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      // If all retries failed, return error
      if (!emailSent) {
        logger.error('All OTP email send attempts failed', {
          userId: user._id,
          error: lastError?.message
        });
        return ResponseHandler.serverError(res, 'Failed to send OTP email. Please try again later.');
      }

      return ResponseHandler.success(res, 'OTP has been sent to your email');
    } catch (error) {
      logger.error('Forgot password error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to process request', error);
    }
  }

  /**
   * Verify OTP
   * POST /api/auth/verify-otp
   */
  static async verifyOTP(req, res) {
    try {
      const { email, otp, role } = req.body;

      if (!email || !otp) {
        return ResponseHandler.badRequest(res, 'Email and OTP are required');
      }

      if (!role) {
        return ResponseHandler.badRequest(res, 'Role is required');
      }

      let user = null;
      let tableName = '';

      // Route to correct table based on role
      if (role === 'STUDENT') {
        user = await Student.findOne({
          email: email.toLowerCase(),
          isCompleted: true, // Only completed student registrations
          passwordResetOTP: otp,
          passwordResetOTPExpires: { $gt: Date.now() }
        });
        tableName = 'Student';
      } else if (role === 'AGENT') {
        user = await Agent.findOne({
          email: email.toLowerCase(),
          passwordResetOTP: otp,
          passwordResetOTPExpires: { $gt: Date.now() }
        });
        tableName = 'Agent';
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        user = await User.findOne({
          email: email.toLowerCase(),
          role,
          passwordResetOTP: otp,
          passwordResetOTPExpires: { $gt: Date.now() }
        });
        tableName = 'User';
      } else {
        return ResponseHandler.badRequest(res, 'Invalid role');
      }

      if (!user) {
        return ResponseHandler.badRequest(res, 'Invalid or expired OTP');
      }

      // Generate reset token (valid for 1 hour)
      const { generateToken } = require('../utils/otpGenerator');
      const resetToken = generateToken();

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      user.passwordResetOTP = undefined; // Clear OTP after verification
      user.passwordResetOTPExpires = undefined;

      await user.save();

      logger.info('OTP verified successfully', { userId: user._id, email: user.email, role, tableName });

      return ResponseHandler.success(res, 'OTP verified successfully', { resetToken });
    } catch (error) {
      logger.error('Verify OTP error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to verify OTP', error);
    }
  }

  /**
   * Reset Password (Role-based)
   * POST /api/auth/reset-password
   * Body: { token, password, confirmPassword, role }
   */
  static async resetPassword(req, res) {
    try {
      const { token, password, confirmPassword, role } = req.body;

      if (!token || !password || !confirmPassword) {
        return ResponseHandler.badRequest(res, 'Token and password are required');
      }

      if (password !== confirmPassword) {
        return ResponseHandler.badRequest(res, 'Passwords do not match');
      }

      // Validate password strength
      const { validatePassword } = require('../utils/passwordValidator');
      const validation = validatePassword(password);
      if (!validation.isValid) {
        return ResponseHandler.badRequest(res, validation.errors.join(', '));
      }

      let user = null;
      let tableName = '';

      // Find user by reset token based on role
      if (role === 'STUDENT') {
        user = await Student.findOne({
          passwordResetToken: token,
          passwordResetExpires: { $gt: Date.now() }
        });
        tableName = 'Student';
      } else if (role === 'AGENT') {
        user = await Agent.findOne({
          passwordResetToken: token,
          passwordResetExpires: { $gt: Date.now() }
        });
        tableName = 'Agent';
      } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        user = await User.findOne({
          passwordResetToken: token,
          passwordResetExpires: { $gt: Date.now() }
        });
        tableName = 'User';
      } else {
        // If no role provided, try all tables (backward compatibility)
        user = await Agent.findOne({
          passwordResetToken: token,
          passwordResetExpires: { $gt: Date.now() }
        });
        if (user) {
          tableName = 'Agent';
        } else {
          user = await Student.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
          });
          if (user) tableName = 'Student';
        }
        if (!user) {
          user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
          });
          if (user) tableName = 'User';
        }
      }

      if (!user) {
        return ResponseHandler.badRequest(res, 'Invalid or expired reset token');
      }

      // Update password (will be hashed by pre-save hook)
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save();

      // Send success email
      try {
        if (tableName === 'Student') {
          await emailService.sendStudentPasswordResetSuccess(user);
        } else {
          await emailService.sendPasswordResetSuccess(user);
        }
      } catch (emailError) {
        logger.error('Failed to send password reset success email', { error: emailError.message });
        // Don't fail the request if email fails
      }

      logger.info('Password reset successful', { userId: user._id, email: user.email, role, tableName });

      return ResponseHandler.success(res, 'Password reset successfully. You can now login with your new password.');
    } catch (error) {
      logger.error('Reset password error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to reset password', error);
    }
  }

  /**
   * Change Password (Authenticated)
   * PUT /api/auth/change-password
   * Body: { oldPassword, newPassword }
   */
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      if (!oldPassword || !newPassword) {
        return ResponseHandler.badRequest(res, 'Old and new passwords are required');
      }

      // Validate new password strength
      const { validatePassword } = require('../utils/passwordValidator');
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        return ResponseHandler.badRequest(res, validation.errors.join(', '));
      }

      let user = null;

      // Find user based on role
      if (userRole === 'STUDENT') {
        user = await Student.findById(userId);
      } else if (userRole === 'AGENT') {
        user = await Agent.findById(userId);
      } else {
        user = await User.findById(userId);
      }

      if (!user) {
        return ResponseHandler.notFound(res, 'User not found');
      }

      // Verify old password
      const isPasswordValid = await user.comparePassword(oldPassword);
      if (!isPasswordValid) {
        return ResponseHandler.badRequest(res, 'Invalid current password');
      }

      // Update password (will be hashed by pre-save hook)
      user.password = newPassword;
      await user.save();

      // Log audit
      await AuditService.log({
        userId: userRole === 'STUDENT' ? null : (userRole === 'AGENT' ? null : user._id),
        userName: user.name || `${user.firstName} ${user.lastName}`,
        userRole: userRole,
        agentId: userRole === 'AGENT' ? user._id : null,
        agentName: userRole === 'AGENT' ? user.name : null,
        action: 'CHANGE_PASSWORD',
        entityType: userRole === 'STUDENT' ? 'Student' : (userRole === 'AGENT' ? 'Agent' : 'User'),
        entityId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        description: 'User changed their password'
      });

      logger.info('Password changed successfully', { userId, role: userRole });

      return ResponseHandler.success(res, 'Password updated successfully');
    } catch (error) {
      logger.error('Change password error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to update password', error);
    }
  }
}

module.exports = AuthController;
