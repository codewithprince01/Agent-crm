const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, attachments = []) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
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
  async sendAgentRegistrationEmail(agent, user) {
    const subject = 'Welcome to University CRM - Registration Pending';
    const html = `
      <h2>Welcome ${user.name}!</h2>
      <p>Thank you for registering as an agent with University CRM.</p>
      <p><strong>Company:</strong> ${agent.company_name}</p>
      <p>Your registration is currently pending approval from our admin team.</p>
      <p>You will be notified once your account is approved.</p>
      <p>Thank you for your patience!</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send agent approval email
   */
  async sendAgentApprovalEmail(agent, user) {
    const subject = 'Agent Account Approved - University CRM';
    const html = `
      <h2>Congratulations ${user.name}!</h2>
      <p>Your agent account has been approved.</p>
      <p>You can now log in and start managing students and applications.</p>
      <p><a href="${process.env.FRONTEND_URL}/login">Login Now</a></p>
      <p>Thank you for partnering with us!</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  /**
   * Send agent rejection email
   */
  async sendAgentRejectionEmail(agent, user, reason) {
    const subject = 'Agent Registration Update - University CRM';
    const html = `
      <h2>Dear ${user.name},</h2>
      <p>Thank you for your interest in becoming an agent with University CRM.</p>
      <p>Unfortunately, we are unable to approve your registration at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have any questions, please contact our support team.</p>
    `;
    return this.sendEmail(user.email, subject, html);
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
}

module.exports = new EmailService();
