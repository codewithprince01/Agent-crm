const { AuditLog } = require('../models');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Log audit event
   */
  static async log(data) {
    try {
      const auditLog = await AuditLog.create({
        userId: data.userId || null,
        userName: data.userName || null,
        userRole: data.userRole || null,
        agentId: data.agentId || null,
        agentName: data.agentName || null,
        studentId: data.studentId || null,
        studentName: data.studentName || null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        description: data.description || null,
      });

      logger.info('Audit log created', {
        auditId: auditLog._id,
        userId: data.userId,
        agentId: data.agentId,
        studentId: data.studentId,
        action: data.action,
        entityType: data.entityType,
      });

      return auditLog;
    } catch (error) {
      logger.error('Error creating audit log', { error: error.message, data });
      // Don't throw - audit logging should never break the main flow
    }
  }

  /**
   * Log user login (Admin/Agent)
   */
  static async logLogin(user, req, userType = 'User') {
    const data = {
      action: 'LOGIN',
      entityType: userType,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };

    this._populateActorData(data, user, userType);
    data.entityId = user?._id || user?.id;

    return this.log(data);
  }

  /**
   * Log user logout
   */
  static async logLogout(user, req, userType = 'User') {
    const data = {
      action: 'LOGOUT',
      entityType: userType,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    };

    this._populateActorData(data, user, userType);
    data.entityId = user?._id || user?.id;

    return this.log(data);
  }

  /**
   * Helper to populate actor data based on user type
   * @private
   */
  static _populateActorData(data, user, userType = 'User') {
    if (!user) {
      data.userName = 'System/Public';
      data.userRole = 'GUEST';
      return;
    }

    const isAgent = userType === 'Agent' || user.role === 'AGENT';
    const isStudent = userType === 'Student' || user.role === 'STUDENT';

    if (isAgent) {
      data.agentId = user._id || user.id;
      data.agentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      data.userRole = 'AGENT';
    } else if (isStudent) {
      data.studentId = user._id || user.id;
      data.studentName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      data.userRole = 'STUDENT';
    } else {
      data.userId = user._id || user.id;
      data.userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      data.userRole = user.role || 'USER';
    }
  }

  /**
   * Log create action
   */
  static async logCreate(user, entityType, entityId, newValues, req) {
    const data = {
      action: 'CREATE',
      entityType,
      entityId,
      newValues,
      ipAddress: req?.ip,
      userAgent: req?.get ? req.get('user-agent') : null,
    };

    this._populateActorData(data, user);
    return this.log(data);
  }

  /**
   * Log update action
   */
  static async logUpdate(user, entityType, entityId, oldValues, newValues, req) {
    const data = {
      action: 'UPDATE',
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: req?.ip,
      userAgent: req?.get ? req.get('user-agent') : null,
    };

    this._populateActorData(data, user);
    return this.log(data);
  }

  /**
   * Log delete action
   */
  static async logDelete(user, entityType, entityId, oldValues, req) {
    const data = {
      action: 'DELETE',
      entityType,
      entityId,
      oldValues,
      ipAddress: req?.ip,
      userAgent: req?.get ? req.get('user-agent') : null,
    };

    this._populateActorData(data, user);
    return this.log(data);
  }

  /**
   * Log approval action
   */
  static async logApprove(user, entityType, entityId, details, req) {
    const data = {
      action: 'APPROVE',
      entityType,
      entityId,
      newValues: details,
      ipAddress: req?.ip,
      userAgent: req?.get ? req.get('user-agent') : null,
    };

    this._populateActorData(data, user);
    return this.log(data);
  }

  /**
   * Log rejection action
   */
  static async logReject(user, entityType, entityId, details, req) {
    const data = {
      action: 'REJECT',
      entityType,
      entityId,
      newValues: details,
      ipAddress: req?.ip,
      userAgent: req?.get ? req.get('user-agent') : null,
    };

    this._populateActorData(data, user);
    return this.log(data);
  }

  /**
   * Log status change
   */
  static async logStatusChange(user, entityType, entityId, oldStatus, newStatus, req) {
    const data = {
      action: 'STATUS_CHANGE',
      entityType,
      entityId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      ipAddress: req?.ip,
      userAgent: req?.get ? req.get('user-agent') : null,
    };

    this._populateActorData(data, user);
    return this.log(data);
  }
}

module.exports = AuditService;
