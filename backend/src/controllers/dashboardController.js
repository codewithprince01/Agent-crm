const { Application, Agent, Student, University, Course, Commission, Payout, User } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class DashboardController {
  /**
   * Get admin dashboard stats
   * GET /api/dashboard/admin
   */
  static async getAdminStats(req, res) {
    try {
      // Total counts
      const totalApplications = await Application.count();
      const totalAgents = await Agent.count({ where: { approval_status: 'approved' } });
      const totalStudents = await Student.count();
      const totalUniversities = await University.count({ where: { status: 'active' } });
      const totalCourses = await Course.count({ where: { status: 'active' } });

      // Applications by status
      const applicationsByStatus = await Application.findAll({
        attributes: ['status', [Application.sequelize.fn('COUNT', Application.sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      });

      // Total revenue (commissions)
      const revenue = await Commission.findOne({
        attributes: [[Commission.sequelize.fn('SUM', Commission.sequelize.col('commission_amount')), 'total']],
        raw: true,
      });

      // Pending payouts
      const pendingPayouts = await Payout.findOne({
        where: { status: 'requested' },
        attributes: [[Payout.sequelize.fn('SUM', Payout.sequelize.col('amount')), 'total']],
        raw: true,
      });

      // Recent applications
      const recentApplications = await Application.findAll({
        limit: 10,
        include: ['student', 'agent', 'university', 'course'],
        order: [['created_at', 'DESC']],
      });

      // Pending agent approvals
      const pendingAgents = await Agent.count({ where: { approval_status: 'pending' } });

      const stats = {
        totalApplications,
        totalAgents,
        totalStudents,
        totalUniversities,
        totalCourses,
        totalRevenue: parseFloat(revenue.total || 0),
        pendingPayouts: parseFloat(pendingPayouts.total || 0),
        pendingAgents,
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        recentApplications,
      };

      return ResponseHandler.success(res, 'Admin dashboard stats retrieved successfully', stats);
    } catch (error) {
      logger.error('Get admin stats error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get admin stats', error);
    }
  }

  /**
   * Get agent dashboard stats
   * GET /api/dashboard/agent
   */
  static async getAgentStats(req, res) {
    try {
      const agent_id = req.user.agent.id;

      // My students
      const myStudents = await Student.count({ where: { agent_id } });

      // My applications
      const myApplications = await Application.count({ where: { agent_id } });

      // Applications by status
      const applicationsByStatus = await Application.findAll({
        where: { agent_id },
        attributes: ['status', [Application.sequelize.fn('COUNT', Application.sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true,
      });

      // Earnings
      const totalEarnings = await Commission.findOne({
        where: { agent_id },
        attributes: [[Commission.sequelize.fn('SUM', Commission.sequelize.col('commission_amount')), 'total']],
        raw: true,
      });

      const pendingEarnings = await Commission.findOne({
        where: { agent_id, status: 'pending' },
        attributes: [[Commission.sequelize.fn('SUM', Commission.sequelize.col('commission_amount')), 'total']],
        raw: true,
      });

      const approvedEarnings = await Commission.findOne({
        where: { agent_id, status: 'approved' },
        attributes: [[Commission.sequelize.fn('SUM', Commission.sequelize.col('commission_amount')), 'total']],
        raw: true,
      });

      const paidEarnings = await Commission.findOne({
        where: { agent_id, status: 'paid' },
        attributes: [[Commission.sequelize.fn('SUM', Commission.sequelize.col('commission_amount')), 'total']],
        raw: true,
      });

      // Recent applications
      const recentApplications = await Application.findAll({
        where: { agent_id },
        limit: 10,
        include: ['student', 'university', 'course'],
        order: [['created_at', 'DESC']],
      });

      const stats = {
        myStudents,
        myApplications,
        totalEarnings: parseFloat(totalEarnings.total || 0),
        pendingEarnings: parseFloat(pendingEarnings.total || 0),
        approvedEarnings: parseFloat(approvedEarnings.total || 0),
        paidEarnings: parseFloat(paidEarnings.total || 0),
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        recentApplications,
      };

      return ResponseHandler.success(res, 'Agent dashboard stats retrieved successfully', stats);
    } catch (error) {
      logger.error('Get agent stats error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get agent stats', error);
    }
  }

  /**
   * Get student dashboard stats
   * GET /api/dashboard/student
   */
  static async getStudentStats(req, res) {
    try {
      const student_id = req.user.student.id;

      // My applications
      const applications = await Application.findAll({
        where: { student_id },
        include: ['university', 'course', 'agent'],
        order: [['created_at', 'DESC']],
      });

      // Applications by status
      const applicationsByStatus = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      const stats = {
        totalApplications: applications.length,
        applicationsByStatus,
        applications,
      };

      return ResponseHandler.success(res, 'Student dashboard stats retrieved successfully', stats);
    } catch (error) {
      logger.error('Get student stats error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to get student stats', error);
    }
  }
}

module.exports = DashboardController;
