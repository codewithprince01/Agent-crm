const { Commission, CommissionRule, Application, Agent, User } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const CommissionService = require('../services/commissionService');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');

class CommissionController {
  /**
   * Get all commissions
   * GET /api/commissions
   */
  static async getAllCommissions(req, res) {
    try {
      const { page = 1, limit = 10, agent_id, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (agent_id) where.agent_id = agent_id;
      if (status) where.status = status;

      // Role-based filtering
      if (req.userRole === 'AGENT') {
        where.agent_id = req.user.agent.id;
      }

      const { count, rows } = await Commission.findAndCountAll({
        where,
        include: [
          {
            model: Application,
            as: 'application',
            include: ['student', 'course', 'university'],
          },
          {
            model: Agent,
            as: 'agent',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.paginated(res, 'Commissions retrieved successfully', rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
      });
    } catch (error) {
      logger.error('Get commissions error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get commissions', error);
    }
  }

  /**
   * Get commission rules
   * GET /api/commissions/rules
   */
  static async getRules(req, res) {
    try {
      const { agent_id, university_id, course_id } = req.query;

      const where = { active: true };
      if (agent_id) where.agent_id = agent_id;
      if (university_id) where.university_id = university_id;
      if (course_id) where.course_id = course_id;

      const rules = await CommissionRule.findAll({
        where,
        include: [
          { model: require('../models').Agent, as: 'agent', required: false },
          { model: require('../models').University, as: 'university', required: false },
          { model: require('../models').Course, as: 'course', required: false },
        ],
        order: [['priority_level', 'ASC']],
      });

      return ResponseHandler.success(res, 'Commission rules retrieved successfully', { rules });
    } catch (error) {
      logger.error('Get commission rules error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get commission rules', error);
    }
  }

  /**
   * Create commission rule
   * POST /api/commissions/rules
   */
  static async createRule(req, res) {
    try {
      const { agent_id, university_id, course_id, commission_type, commission_value } = req.body;

      const rule = await CommissionService.createRule({
        agent_id,
        university_id,
        course_id,
        commission_type,
        commission_value,
        active: true,
      });

      await AuditService.logCreate(req.user, 'CommissionRule', rule.id, rule.toJSON(), req);

      logger.info('Commission rule created', { ruleId: rule.id });

      return ResponseHandler.created(res, 'Commission rule created successfully', { rule });
    } catch (error) {
      logger.error('Create commission rule error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to create commission rule', error);
    }
  }

  /**
   * Update commission rule
   * PUT /api/commissions/rules/:id
   */
  static async updateRule(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const rule = await CommissionRule.findByPk(id);
      if (!rule) {
        return ResponseHandler.notFound(res, 'Commission rule not found');
      }

      const oldValue = rule.toJSON();
      await rule.update(updateData);

      await AuditService.logUpdate(req.user, 'CommissionRule', rule.id, oldValue, rule.toJSON(), req);

      logger.info('Commission rule updated', { ruleId: id });

      return ResponseHandler.success(res, 'Commission rule updated successfully', { rule });
    } catch (error) {
      logger.error('Update commission rule error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to update commission rule', error);
    }
  }

  /**
   * Delete commission rule
   * DELETE /api/commissions/rules/:id
   */
  static async deleteRule(req, res) {
    try {
      const { id } = req.params;

      const rule = await CommissionRule.findByPk(id);
      if (!rule) {
        return ResponseHandler.notFound(res, 'Commission rule not found');
      }

      await AuditService.logDelete(req.user, 'CommissionRule', id, rule.toJSON(), req);
      await rule.destroy();

      logger.info('Commission rule deleted', { ruleId: id });

      return ResponseHandler.success(res, 'Commission rule deleted successfully');
    } catch (error) {
      logger.error('Delete commission rule error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to delete commission rule', error);
    }
  }

  /**
   * Approve commission
   * PUT /api/commissions/:id/approve
   */
  static async approveCommission(req, res) {
    try {
      const { id } = req.params;

      const commission = await Commission.findByPk(id);
      if (!commission) {
        return ResponseHandler.notFound(res, 'Commission not found');
      }

      await commission.update({
        status: 'approved',
        approved_by: req.userId,
        approved_at: new Date(),
      });

      await AuditService.logApprove(req.user, 'Commission', commission.id, { approvedBy: req.userId }, req);

      logger.info('Commission approved', { commissionId: id });

      return ResponseHandler.success(res, 'Commission approved successfully', { commission });
    } catch (error) {
      logger.error('Approve commission error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to approve commission', error);
    }
  }
}

module.exports = CommissionController;
