const { Payout, Agent, User, Commission } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const CommissionService = require('../services/commissionService');
const AuditService = require('../services/auditService');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

class PayoutController {
  /**
   * Get all payouts
   * GET /api/payouts
   */
  static async getAllPayouts(req, res) {
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

      const { count, rows } = await Payout.findAndCountAll({
        where,
        include: [
          {
            model: Agent,
            as: 'agent',
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
          },
          {
            model: User,
            as: 'processor',
            attributes: ['id', 'name', 'email'],
            required: false,
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      return ResponseHandler.paginated(res, 'Payouts retrieved successfully', rows, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems: count,
      });
    } catch (error) {
      logger.error('Get payouts error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get payouts', error);
    }
  }

  /**
   * Get agent earnings
   * GET /api/payouts/earnings
   */
  static async getEarnings(req, res) {
    try {
      let agent_id = req.query.agent_id;

      // If agent role, use their own agent ID
      if (req.userRole === 'AGENT') {
        agent_id = req.user.agent.id;
      }

      if (!agent_id) {
        return ResponseHandler.error(res, 'Agent ID is required');
      }

      const earnings = await CommissionService.getAgentEarnings(agent_id);

      return ResponseHandler.success(res, 'Earnings retrieved successfully', { earnings });
    } catch (error) {
      logger.error('Get earnings error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get earnings', error);
    }
  }

  /**
   * Request payout
   * POST /api/payouts/request
   */
  static async requestPayout(req, res) {
    try {
      const { amount, notes } = req.body;
      const agent_id = req.user.agent.id;

      // Check agent's approved earnings
      const earnings = await CommissionService.getAgentEarnings(agent_id);

      if (earnings.approvedEarnings < amount) {
        return ResponseHandler.error(res, 'Insufficient approved earnings for payout');
      }

      // Generate payout number
      const payoutNumber = `PAY-${Date.now()}-${agent_id}`;

      const payout = await Payout.create({
        payout_number: payoutNumber,
        agent_id,
        amount,
        status: 'requested',
        notes,
      });

      await AuditService.logCreate(req.user, 'Payout', payout.id, payout.toJSON(), req);

      logger.info('Payout requested', { payoutId: payout.id, agentId: agent_id });

      return ResponseHandler.created(res, 'Payout request submitted successfully', { payout });
    } catch (error) {
      logger.error('Request payout error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to request payout', error);
    }
  }

  /**
   * Approve payout
   * PUT /api/payouts/:id/approve
   */
  static async approvePayout(req, res) {
    try {
      const { id } = req.params;
      const { payment_reference, payment_method } = req.body;

      const payout = await Payout.findByPk(id, {
        include: [
          {
            model: Agent,
            as: 'agent',
            include: [{ model: User, as: 'user' }],
          },
        ],
      });

      if (!payout) {
        return ResponseHandler.notFound(res, 'Payout not found');
      }

      if (payout.status !== 'requested') {
        return ResponseHandler.error(res, 'Payout cannot be approved');
      }

      await payout.update({
        status: 'approved',
        processed_by: req.userId,
        processed_at: new Date(),
        payment_reference,
        payment_method,
      });

      // Update related commissions to 'paid'
      await Commission.update(
        { status: 'paid' },
        {
          where: {
            agent_id: payout.agent_id,
            status: 'approved',
          },
        }
      );

      // Send approval email
      await emailService.sendPayoutApprovedEmail(payout, payout.agent, payout.agent.user);

      await AuditService.logApprove(req.user, 'Payout', payout.id, { approvedBy: req.userId }, req);

      logger.info('Payout approved', { payoutId: id });

      return ResponseHandler.success(res, 'Payout approved successfully', { payout });
    } catch (error) {
      logger.error('Approve payout error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to approve payout', error);
    }
  }

  /**
   * Reject payout
   * PUT /api/payouts/:id/reject
   */
  static async rejectPayout(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const payout = await Payout.findByPk(id);
      if (!payout) {
        return ResponseHandler.notFound(res, 'Payout not found');
      }

      await payout.update({
        status: 'rejected',
        processed_by: req.userId,
        processed_at: new Date(),
        notes,
      });

      await AuditService.logReject(req.user, 'Payout', payout.id, { rejectedBy: req.userId, notes }, req);

      logger.info('Payout rejected', { payoutId: id });

      return ResponseHandler.success(res, 'Payout rejected', { payout });
    } catch (error) {
      logger.error('Reject payout error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to reject payout', error);
    }
  }

  /**
   * Mark payout as paid
   * PUT /api/payouts/:id/mark-paid
   */
  static async markAsPaid(req, res) {
    try {
      const { id } = req.params;
      const { payment_reference } = req.body;

      const payout = await Payout.findByPk(id);
      if (!payout) {
        return ResponseHandler.notFound(res, 'Payout not found');
      }

      await payout.update({
        status: 'paid',
        payment_reference,
        processed_by: req.userId,
        processed_at: new Date(),
      });

      logger.info('Payout marked as paid', { payoutId: id });

      return ResponseHandler.success(res, 'Payout marked as paid successfully', { payout });
    } catch (error) {
      logger.error('Mark payout as paid error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to mark payout as paid', error);
    }
  }
}

module.exports = PayoutController;
