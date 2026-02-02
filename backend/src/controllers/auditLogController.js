const { AuditLog, User } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class AuditLogController {
  /**
   * Get all audit logs
   * GET /api/audit-logs
   */
  static async getAllLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        user_id,
        role,
        action,
        entity,
        start_date,
        end_date,
      } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (user_id) where.user_id = user_id;
      if (role) where.role = role;
      if (action) where.action = action;
      if (entity) where.entity = entity;

      if (start_date && end_date) {
        where.created_at = {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        };
      }

      const { count, rows } = await AuditLog.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'role'],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.paginated(res, 'Audit logs retrieved successfully', rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
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

      const log = await AuditLog.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'role'],
          },
        ],
      });

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
   * GET /api/audit-logs/entity/:entity/:entityId
   */
  static async getEntityLogs(req, res) {
    try {
      const { entity, entityId } = req.params;

      const logs = await AuditLog.findAll({
        where: {
          entity,
          entity_id: entityId,
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'role'],
            required: false,
          },
        ],
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.success(res, 'Entity audit logs retrieved successfully', { logs });
    } catch (error) {
      logger.error('Get entity logs error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get entity logs', error);
    }
  }
}

module.exports = AuditLogController;
