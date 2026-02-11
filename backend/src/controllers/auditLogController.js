const { AuditLog, User, Agent } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

class AuditLogController {
  /**
   * Get all audit logs with filtering
   * GET /api/audit-logs
   */
  static async getAllLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        userRole,
        action,
        entityType,
        startDate,
        endDate,
        searchTerm,
      } = req.query;

      const skip = (page - 1) * limit;
      const query = {};

      // Filter by role
      if (userRole) {
        query.userRole = userRole;
      }

      // Filter by action
      if (action) {
        query.action = action;
      }

      // Filter by entity type
      if (entityType) {
        query.entityType = entityType;
      }

      // Filter by date range
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Filter by search term (userName or agentName)
      if (searchTerm) {
        query.$or = [
          { userName: { $regex: searchTerm, $options: 'i' } },
          { agentName: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      const logs = await AuditLog.find(query)
        .populate('userId', 'name email role')
        .populate('agentId', 'firstName lastName email')
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 });

      const count = await AuditLog.countDocuments(query);

      // Debug logging
      logger.info('Audit logs fetched', {
        count: logs.length,
        totalCount: count,
        firstLog: logs[0] ? {
          id: logs[0]._id,
          action: logs[0].action,
          userRole: logs[0].userRole,
          userName: logs[0].userName,
          userId: logs[0].userId,
          entityType: logs[0].entityType,
          ipAddress: logs[0].ipAddress,
        } : null,
      });

      return ResponseHandler.paginated(res, 'Audit logs retrieved successfully', logs, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
        totalPages: Math.ceil(count / limit),
      });
    } catch (error) {
      logger.error('Get audit logs error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get audit logs', error);
    }
  }

  /**
   * Get audit log by ID
   * GET /api/audit-logs/:id
   */
  static async getLogById(req, res) {
    try {
      const { id } = req.params;

      const log = await AuditLog.findById(id)
        .populate('userId', 'name email role')
        .populate('agentId', 'firstName lastName email');

      if (!log) {
        return ResponseHandler.notFound(res, 'Audit log not found');
      }

      return ResponseHandler.success(res, 'Audit log retrieved successfully', { log });
    } catch (error) {
      logger.error('Get audit log error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get audit log', error);
    }
  }

  /**
   * Get audit logs for specific entity
   * GET /api/audit-logs/entity/:entityType/:entityId
   */
  static async getEntityLogs(req, res) {
    try {
      const { entityType, entityId } = req.params;

      const logs = await AuditLog.find({
        entityType,
        entityId,
      })
        .populate('userId', 'name email role')
        .populate('agentId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      return ResponseHandler.success(res, 'Entity audit logs retrieved successfully', { logs });
    } catch (error) {
      logger.error('Get entity logs error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get entity logs', error);
    }
  }

  /**
   * Clear all audit logs
   * DELETE /api/audit-logs/clear
   */
  static async clearAllLogs(req, res) {
    try {
      await AuditLog.deleteMany({});

      logger.info('Audit logs cleared', { clearedBy: req.user.id });

      return ResponseHandler.success(res, 'All audit logs cleared successfully');
    } catch (error) {
      logger.error('Clear audit logs error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to clear audit logs', error);
    }
  }
}

module.exports = AuditLogController;
