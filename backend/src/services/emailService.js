const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Lazy initialization - only create transporter when email is being sent
    // This prevents blocking the server startup if SMTP is misconfigured
    this.transporter = null;
    this.createTransporter();
  }

  createTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465, // true for port 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        // Connection timeout and pool settings to prevent hanging
        connectionTimeout: 5000, // 5 seconds
        greetingTimeout: 5000,
        socketTimeout: 5000,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
      });

      // Verify connection on creation (non-blocking)
      this.transporter.verify((error) => {
        if (error) {
          logger.warn('SMTP connection verification failed (non-blocking)', { error: error.message });
        } else {
          logger.info('SMTP server is ready to send emails');
        }
      });
    }
    return this.transporter;
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, attachments = []) {
    try {
      // Ensure transporter is created
      const transporter = this.createTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error('Error sending email', { to, subject, error: error.message });
      throw error;
    }
  }

  /**
   * Send agent registration email
   */
  async sendAgentRegistrationEmail(agent) {
    const subject = 'Welcome to University CRM - Registration Pending';
    const html = `
      <h2>Welcome ${agent.first_name} ${agent.last_name}!</h2>
      <p>Thank you for registering as an agent with University CRM.</p>
      <p><strong>Company:</strong> ${agent.company_name}</p>
      <p><strong>Email:</strong> ${agent.email}</p>
      <p>Your registration is currently pending approval from our admin team.</p>
      <p>You will be notified once your account is approved.</p>
      <p>Thank you for your patience!</p>
    `;
    return this.sendEmail(agent.email, subject, html);
  }

  /**
   * Send agent approval email
   */
  async sendAgentApprovalEmail(agent) {
    const subject = 'Agent Account Approved - University CRM';
    const html = `
      <h2>Congratulations ${agent.first_name} ${agent.last_name}!</h2>
      <p>Your agent account has been approved.</p>
      <p><strong>Company:</strong> ${agent.company_name}</p>
      <p><strong>Email:</strong> ${agent.email}</p>
      <p>You can now log in and start managing students and applications.</p>
      <p><a href="${process.env.FRONTEND_URL}/login">Login Now</a></p>
      <p>Thank you for partnering with us!</p>
    `;
    return this.sendEmail(agent.email, subject, html);
  }

  /**
   * Send agent rejection email
   */
  async sendAgentRejectionEmail(agent, reason) {
    const subject = 'Agent Registration Update - University CRM';
    const html = `
      <h2>Dear ${agent.first_name} ${agent.last_name},</h2>
      <p>Thank you for your interest in becoming an agent with University CRM.</p>
      <p>Unfortunately, we are unable to approve your registration at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have any questions, please contact our support team.</p>
    `;
    return this.sendEmail(agent.email, subject, html);
  }

  /**
   * Send application status update email
   */
  async sendApplicationStatusEmail(application, student, user, newStatus) {
    const subject = `Application Status Update: ${newStatus}`;
    const html = `
      <h2>Application Status Update</h2>
      <p>Dear ${user.name},</p>
      <p>Your application status has been updated.</p>
      <p><strong>University:</strong> ${application.university?.name || 'N/A'}</p>
      <p><strong>Course:</strong> ${application.course?.name || 'N/A'}</p>
      <p><strong>New Status:</strong> ${newStatus.toUpperCase().replace(/_/g, ' ')}</p>
      <p><a href="${process.env.FRONTEND_URL}/applications/${application.id}">View Application</a></p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send payout approved email
   */
  async sendPayoutApprovedEmail(payout, agent, user) {
    const subject = 'Payout Request Approved';
    const html = `
      <h2>Payout Approved</h2>
      <p>Dear ${user.name},</p>
      <p>Your payout request has been approved.</p>
      <p><strong>Amount:</strong> $${payout.amount}</p>
      <p><strong>Payout Number:</strong> ${payout.payout_number}</p>
      <p>The payment will be processed shortly and credited to your registered bank account.</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Password Reset Request';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>Dear ${user.name},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }
  /**
   * Send welcome email with credentials
   */
  async sendWelcomeWithCredentials(agent, plainPassword) {
    const subject = 'Welcome to University CRM - Your Login Credentials';
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const html = `
      <h2>Welcome ${agent.firstName || agent.name}!</h2>
      <p>Your agent account has been created/approved.</p>
      <p>Here are your login credentials:</p>
      <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      <p><strong>Email:</strong> ${agent.email}</p>
      <p><strong>Password:</strong> ${plainPassword}</p>
      <p>Please change your password after your first login.</p>
      <br>
      <p>Best regards,</p>
      <p>University CRM Team</p>
    `;
    return this.sendEmail(agent.email, subject, html);
  }

  /**
   * Send password setup email (first-time)
   */
  async sendPasswordSetupEmail(agent, setupToken) {
    const subject = 'Agent Account Approved - Set Your Password';
    const setupUrl = `${process.env.FRONTEND_URL}/setup-password?token=${setupToken}`;
    const html = `
      <h2>Congratulations ${agent.firstName || agent.name}!</h2>
      <p>Your agent account has been <strong>approved</strong> by our admin team.</p>
      <p><strong>Your Registered Email:</strong> ${agent.email}</p>
      <p>To access your account, please set your password by clicking the link below:</p>
      <p style="margin: 20px 0;">
        <a href="${setupUrl}" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Set Your Password
        </a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>${setupUrl}</p>
      <p><strong>Important:</strong> This link will expire in 24 hours.</p>
      <p><strong>Password Requirements:</strong></p>
      <ul>
        <li>At least 8 characters</li>
        <li>At least one uppercase letter</li>
        <li>At least one lowercase letter</li>
        <li>At least one number</li>
        <li>At least one special character (!@#$%^&*...)</li>
      </ul>
      <br>
      <p>Best regards,</p>
      <p>University CRM Team</p>
    `;
    return this.sendEmail(agent.email, subject, html);
  }

  /**
   * Send password reset OTP
   */
  async sendPasswordResetOTP(agent, otp) {
    const subject = 'Password Reset OTP - University CRM';
    const html = `
      <h2>Password Reset Request</h2>
      <p>Dear ${agent.firstName || agent.name},</p>
      <p>We received a request to reset your password. Use the OTP below to verify your identity:</p>
      <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; color: #4F46E5;">${otp}</h1>
      </div>
      <p><strong>This OTP will expire in 10 minutes.</strong></p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
      <br>
      <p>Best regards,</p>
      <p>University CRM Team</p>
    `;
    return this.sendEmail(agent.email, subject, html);
  }

  /**
   * Send password reset success confirmation
   */
  async sendPasswordResetSuccess(agent) {
    const subject = 'Password Reset Successful - University CRM';
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const html = `
      <h2>Password Reset Successful</h2>
      <p>Dear ${agent.firstName || agent.name},</p>
      <p>Your password has been successfully reset.</p>
      <p>You can now log in with your new password:</p>
      <p style="margin: 20px 0;">
        <a href="${loginUrl}" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Login Now
        </a>
      </p>
      <p>If you didn't make this change, please contact our support team immediately.</p>
      <br>
      <p>Best regards,</p>
      <p>University CRM Team</p>
    `;
    return this.sendEmail(agent.email, subject, html);
  }

  /**
   * Send student welcome email with password setup link
   */
  async sendStudentWelcomeEmail(student, setupToken) {
    const subject = 'Welcome to Britannica Overseas - Set Your Password';
    const setupUrl = `${process.env.FRONTEND_URL}/student/setup-password?token=${setupToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Welcome!</h1>
          <p style="margin: 10px 0 0;">Your journey with Britannica Overseas begins here</p>
        </div>
        <div style="padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px; background-color: #f9f9fafb;">
          <p>Dear ${student.firstName} ${student.lastName},</p>
          <p>Congratulations! Your registration has been successful. To get started and access your student portal, please set up your account password by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" 
               style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
              Create Your Password
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4F46E5; font-size: 14px;">${setupUrl}</p>
          
          <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400E; font-size: 14px;"><strong>Note:</strong> This link is valid for 24 hours. After it expires, you can use the "Forgot Password" option to get a new link.</p>
          </div>
          
          <p>Best regards,<br><strong>Britannica Overseas Team</strong></p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6B7280;">
          <p>&copy; ${new Date().getFullYear()} Britannica Overseas. All rights reserved.</p>
        </div>
      </div>
    `;
    return this.sendEmail(student.email, subject, html);
  }

  /**
   * Send student password reset OTP
   */
  async sendStudentPasswordResetOTP(student, otp) {
    const subject = 'Password Reset OTP - Britannica Overseas';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">Password Reset Request</h2>
        </div>
        <div style="padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Dear ${student.firstName || 'Student'},</p>
          <p>We received a request to reset your password. Use the 6-digit OTP below to verify your identity:</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 30px 0; border-radius: 12px; border: 2px dashed #4F46E5;">
            <h1 style="margin: 0; font-size: 42px; letter-spacing: 12px; color: #4F46E5;">${otp}</h1>
          </div>
          
          <p><strong>This OTP will expire in 10 minutes.</strong></p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          <p style="font-size: 14px; color: #6B7280;">Best regards,<br>Britannica Overseas Team</p>
        </div>
      </div>
    `;
    return this.sendEmail(student.email, subject, html);
  }

  /**
   * Send student password reset success confirmation
   */
  async sendStudentPasswordResetSuccess(student) {
    const subject = 'Password Reset Successful - Britannica Overseas';
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">Password Updated!</h2>
        </div>
        <div style="padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Dear ${student.firstName || 'Student'},</p>
          <p>Your password has been successfully reset. You can now log in with your new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Login to Your Portal
            </a>
          </div>
          
          <p>If you didn't make this change, please contact our support team immediately as your account security might be at risk.</p>
          <p>Best regards,<br>Britannica Overseas Team</p>
        </div>
      </div>
    `;
    return this.sendEmail(student.email, subject, html);
  }

  /**
   * Send verification OTP for partner applications
   */
  async sendVerificationOTP(email, otp) {
    const subject = 'Email Verification Code - Partner Program';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h2 style="margin: 0;">Email Verification</h2>
        </div>
        <div style="padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px;">
          <p>Hello,</p>
          <p>Thank you for your interest in our Partner Program. Please use the following code to verify your email address:</p>
          
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 30px 0; border-radius: 12px; border: 2px dashed #4F46E5;">
            <h1 style="margin: 0; font-size: 42px; letter-spacing: 12px; color: #4F46E5;">${otp}</h1>
          </div>
          
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          <p style="font-size: 14px; color: #6B7280;">Best regards,<br>University Team</p>
        </div>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
