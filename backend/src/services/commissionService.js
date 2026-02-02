const { CommissionRule, Agent, Course, University } = require('../models');
const { COMMISSION_TYPE, COMMISSION_PRIORITY } = require('../utils/constants');
const logger = require('../utils/logger');

class CommissionService {
  /**
   * Calculate commission based on priority rules
   * Priority: 1. Agent+Course, 2. Agent+University, 3. Course Default, 4. University Default
   */
  static async calculateCommission(agentId, courseId, universityId, tuitionFee) {
    try {
      logger.info('Calculating commission', { agentId, courseId, universityId, tuitionFee });

      // Priority 1: Agent + Course specific
      let rule = await CommissionRule.findOne({
        where: {
          agent_id: agentId,
          course_id: courseId,
          active: true,
        },
        order: [['priority_level', 'ASC']],
      });

      if (rule) {
        return this.applyCommissionRule(rule, tuitionFee, COMMISSION_PRIORITY.AGENT_COURSE);
      }

      // Priority 2: Agent + University specific
      rule = await CommissionRule.findOne({
        where: {
          agent_id: agentId,
          university_id: universityId,
          course_id: null,
          active: true,
        },
        order: [['priority_level', 'ASC']],
      });

      if (rule) {
        return this.applyCommissionRule(rule, tuitionFee, COMMISSION_PRIORITY.AGENT_UNIVERSITY);
      }

      // Priority 3: Course default (no agent)
      rule = await CommissionRule.findOne({
        where: {
          agent_id: null,
          course_id: courseId,
          active: true,
        },
        order: [['priority_level', 'ASC']],
      });

      if (rule) {
        return this.applyCommissionRule(rule, tuitionFee, COMMISSION_PRIORITY.COURSE_DEFAULT);
      }

      // Priority 4: University default (no agent, no course)
      rule = await CommissionRule.findOne({
        where: {
          agent_id: null,
          university_id: universityId,
          course_id: null,
          active: true,
        },
        order: [['priority_level', 'ASC']],
      });

      if (rule) {
        return this.applyCommissionRule(rule, tuitionFee, COMMISSION_PRIORITY.UNIVERSITY_DEFAULT);
      }

      // No commission rule found
      logger.warn('No commission rule found', { agentId, courseId, universityId });
      return {
        commissionAmount: 0,
        commissionType: null,
        commissionValue: 0,
        ruleId: null,
        priority: null,
      };
    } catch (error) {
      logger.error('Error calculating commission', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Apply commission rule to calculate amount
   */
  static applyCommissionRule(rule, tuitionFee, priority) {
    let commissionAmount = 0;

    if (rule.commission_type === COMMISSION_TYPE.PERCENTAGE) {
      commissionAmount = (tuitionFee * rule.commission_value) / 100;
    } else if (rule.commission_type === COMMISSION_TYPE.FLAT) {
      commissionAmount = parseFloat(rule.commission_value);
    }

    return {
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      commissionType: rule.commission_type,
      commissionValue: parseFloat(rule.commission_value),
      ruleId: rule.id,
      priority,
    };
  }

  /**
   * Create commission rule
   */
  static async createRule(ruleData) {
    try {
      // Determine priority level
      let priorityLevel = COMMISSION_PRIORITY.UNIVERSITY_DEFAULT;

      if (ruleData.agent_id && ruleData.course_id) {
        priorityLevel = COMMISSION_PRIORITY.AGENT_COURSE;
      } else if (ruleData.agent_id && ruleData.university_id) {
        priorityLevel = COMMISSION_PRIORITY.AGENT_UNIVERSITY;
      } else if (ruleData.course_id) {
        priorityLevel = COMMISSION_PRIORITY.COURSE_DEFAULT;
      }

      const rule = await CommissionRule.create({
        ...ruleData,
        priority_level: priorityLevel,
      });

      logger.info('Commission rule created', { ruleId: rule.id });
      return rule;
    } catch (error) {
      logger.error('Error creating commission rule', { error: error.message });
      throw error;
    }
  }

  /**
   * Get agent's total earnings
   */
  static async getAgentEarnings(agentId) {
    const { Commission } = require('../models');
    const { Op } = require('sequelize');

    try {
      const earnings = await Commission.findAll({
        where: { agent_id: agentId },
        attributes: [
          [Commission.sequelize.fn('SUM', Commission.sequelize.col('commission_amount')), 'totalEarnings'],
          [
            Commission.sequelize.fn(
              'SUM',
              Commission.sequelize.literal("CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END")
            ),
            'pendingEarnings',
          ],
          [
            Commission.sequelize.fn(
              'SUM',
              Commission.sequelize.literal("CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END")
            ),
            'approvedEarnings',
          ],
          [
            Commission.sequelize.fn(
              'SUM',
              Commission.sequelize.literal("CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END")
            ),
            'paidEarnings',
          ],
        ],
        raw: true,
      });

      return {
        totalEarnings: parseFloat(earnings[0].totalEarnings || 0),
        pendingEarnings: parseFloat(earnings[0].pendingEarnings || 0),
        approvedEarnings: parseFloat(earnings[0].approvedEarnings || 0),
        paidEarnings: parseFloat(earnings[0].paidEarnings || 0),
      };
    } catch (error) {
      logger.error('Error getting agent earnings', { agentId, error: error.message });
      throw error;
    }
  }
}

module.exports = CommissionService;
