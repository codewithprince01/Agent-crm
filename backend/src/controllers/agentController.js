const { Agent, User, AgentBankDetail } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const { AGENT_APPROVAL_STATUS } = require('../utils/constants');
const { Op } = require('sequelize');

class AgentController {
  /**
   * Get all agents
   * GET /api/agents
   */
  static async getAllAgents(req, res) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) {
        where.approval_status = status;
      }

      const userWhere = {};
      if (search) {
        userWhere[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Agent.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            where: userWhere,
            attributes: { exclude: ['password'] },
          },
          {
            model: AgentBankDetail,
            as: 'bankDetails',
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.paginated(res, 'Agents retrieved successfully', rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
      });
    } catch (error) {
      logger.error('Get agents error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get agents', error);
    }
  }

  /**
   * Get agent by ID
   * GET /api/agents/:id
   */
  static async getAgentById(req, res) {
    try {
      const { id } = req.params;

      const agent = await Agent.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: { exclude: ['password'] },
          },
          {
            model: AgentBankDetail,
            as: 'bankDetails',
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'name', 'email'],
            required: false,
          },
        ],
      });

      if (!agent) {
        return ResponseHandler.notFound(res, 'Agent not found');
      }

      return ResponseHandler.success(res, 'Agent retrieved successfully', { agent });
    } catch (error) {
      logger.error('Get agent error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get agent', error);
    }
  }

  /**
   * Approve agent
   * PUT /api/agents/:id/approve
   */
  static async approveAgent(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const agent = await Agent.findByPk(id, {
        include: [{ model: User, as: 'user' }],
      });

      if (!agent) {
        return ResponseHandler.notFound(res, 'Agent not found');
      }

      if (agent.approval_status === AGENT_APPROVAL_STATUS.APPROVED) {
        return ResponseHandler.error(res, 'Agent is already approved');
      }

      // Update agent status
      await agent.update({
        approval_status: AGENT_APPROVAL_STATUS.APPROVED,
        approved_by: req.userId,
        approved_at: new Date(),
        approval_notes: notes || null,
      });

      // Send approval email
      await emailService.sendAgentApprovalEmail(agent, agent.user);

      // Log audit
      await AuditService.logApprove(
        req.user,
        'Agent',
        agent.id,
        {
          agentId: agent.id,
          approvedBy: req.userId,
          notes,
        },
        req
      );

      logger.info('Agent approved', { agentId: agent.id, approvedBy: req.userId });

      return ResponseHandler.success(res, 'Agent approved successfully', { agent });
    } catch (error) {
      logger.error('Approve agent error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to approve agent', error);
    }
  }

  /**
   * Reject agent
   * PUT /api/agents/:id/reject
   */
  static async rejectAgent(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const agent = await Agent.findByPk(id, {
        include: [{ model: User, as: 'user' }],
      });

      if (!agent) {
        return ResponseHandler.notFound(res, 'Agent not found');
      }

      if (agent.approval_status === AGENT_APPROVAL_STATUS.REJECTED) {
        return ResponseHandler.error(res, 'Agent is already rejected');
      }

      // Update agent status
      await agent.update({
        approval_status: AGENT_APPROVAL_STATUS.REJECTED,
        rejected_at: new Date(),
        approval_notes: notes || null,
      });

      // Send rejection email
      await emailService.sendAgentRejectionEmail(agent, agent.user, notes);

      // Log audit
      await AuditService.logReject(
        req.user,
        'Agent',
        agent.id,
        {
          agentId: agent.id,
          rejectedBy: req.userId,
          notes,
        },
        req
      );

      logger.info('Agent rejected', { agentId: agent.id, rejectedBy: req.userId });

      return ResponseHandler.success(res, 'Agent rejected', { agent });
    } catch (error) {
      logger.error('Reject agent error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to reject agent', error);
    }
  }

  /**
   * Update agent bank details
   * PUT /api/agents/:id/bank-details
   */
  static async updateBankDetails(req, res) {
    try {
      const { id } = req.params;
      const { bank_name, account_number, account_holder_name, ifsc_code, swift_code, branch_name } = req.body;

      const agent = await Agent.findByPk(id);
      if (!agent) {
        return ResponseHandler.notFound(res, 'Agent not found');
      }

      // Check if requesting user is the agent owner or admin
      const isOwner = req.userRole === 'AGENT' && agent.user_id === req.userId;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.userRole);

      if (!isOwner && !isAdmin) {
        return ResponseHandler.forbidden(res, 'Not authorized to update bank details');
      }

      // Find or create bank details
      let bankDetails = await AgentBankDetail.findOne({ where: { agent_id: id } });

      if (bankDetails) {
        await bankDetails.update({
          bank_name,
          account_number,
          account_holder_name,
          ifsc_code,
          swift_code,
          branch_name,
          verified: false, // Reset verification on update
        });
      } else {
        bankDetails = await AgentBankDetail.create({
          agent_id: id,
          bank_name,
          account_number,
          account_holder_name,
          ifsc_code,
          swift_code,
          branch_name,
        });
      }

      // Log audit
      await AuditService.logUpdate(req.user, 'AgentBankDetail', bankDetails.id, null, bankDetails.toJSON(), req);

      logger.info('Agent bank details updated', { agentId: id, bankDetailsId: bankDetails.id });

      return ResponseHandler.success(res, 'Bank details updated successfully', { bankDetails });
    } catch (error) {
      logger.error('Update bank details error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to update bank details', error);
    }
  }

  /**
   * Get pending agents
   * GET /api/agents/pending
   */
  static async getPendingAgents(req, res) {
    try {
      const agents = await Agent.findAll({
        where: { approval_status: AGENT_APPROVAL_STATUS.PENDING },
        include: [
          {
            model: User,
            as: 'user',
            attributes: { exclude: ['password'] },
          },
        ],
        order: [['created_at', 'ASC']],
      });

      return ResponseHandler.success(res, 'Pending agents retrieved successfully', { agents, count: agents.length });
    } catch (error) {
      logger.error('Get pending agents error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get pending agents', error);
    }
  }
}

module.exports = AgentController;
