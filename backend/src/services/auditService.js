const { AuditLog } = require('../models');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Log audit event
   */
  static async log(data) {
    try {
      const auditLog = await AuditLog.create({
        user_id: data.userId || null,
        role: data.role || null,
        action: data.action,
        entity: data.entity,
        entity_id: data.entityId || null,
        old_value: data.oldValue || null,
        new_value: data.newValue || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      });

      logger.info('Audit log created', {
        auditId: auditLog.id,
        userId: data.userId,
        action: data.action,
        entity: data.entity,
      });

      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log', { error: error.message, data });
      // Don't throw - audit logging should never break the main flow
    }
  }

  /**
   * Log user login
   */
  static async logLogin(user, req) {
    return this.log({
      userId: user.id,
      role: user.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log user logout
   */
  static async logLogout(user, req) {
    return this.log({
      userId: user.id,
      role: user.role,
      action: 'LOGOUT',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log create action
   */
  static async logCreate(user, entity, entityId, newValue, req) {
    return this.log({
      userId: user.id,
      role: user.role,
      action: 'CREATE',
      entity,
      entityId,
      newValue,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log update action
   */
  static async logUpdate(user, entity, entityId, oldValue, newValue, req) {
    return this.log({
      userId: user.id,
      role: user.role,
      action: 'UPDATE',
      entity,
      entityId,
      oldValue,
      newValue,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log delete action
   */
  static async logDelete(user, entity, entityId, oldValue, req) {
    return this.log({
      userId: user.id,
      role: user.role,
      action: 'DELETE',
      entity,
      entityId,
      oldValue,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log approval action
   */
  static async logApprove(user, entity, entityId, details, req) {
    return this.log({
      userId: user.id,
      role: user.role,
      action: 'APPROVE',
      entity,
      entityId,
      newValue: details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log rejection action
   */
  static async logReject(user, entity, entityId, details, req) {
    return this.log({
      userId: user.id,
      role: user.role,
      action: 'REJECT',
      entity,
      entityId,
      newValue: details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }

  /**
   * Log status change
   */
  static async logStatusChange(user, entity, entityId, oldStatus, newStatus, req) {
    return this.log({
      userId: user.id,
      role: user.role,
      action: 'STATUS_CHANGE',
      entity,
      entityId,
      oldValue: { status: oldStatus },
      newValue: { status: newStatus },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  }
}

module.exports = AuditService;
