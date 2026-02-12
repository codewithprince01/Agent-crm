const { Application, Agent, Student, University, Course, Commission, Payout, User } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

class DashboardController {
  /**
   * Get admin dashboard stats
   * GET /api/dashboard/admin
   */
  static async getAdminStats(req, res) {
    try {
      // Total counts
      const totalApplications = await Application.countDocuments();
      const totalAgents = await Agent.countDocuments({ approvalStatus: 'approved' });
      const totalStudents = await Student.countDocuments();
      const totalUniversities = await University.countDocuments({ status: 'active' });
      const totalCourses = await Course.countDocuments({ status: 'active' });

      // Applications by status using aggregation
      const applicationsByStatusRaw = await Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const applicationsByStatus = applicationsByStatusRaw.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      // Total revenue (commissions) using aggregation
      const revenueRaw = await Commission.aggregate([
        { $group: { _id: null, total: { $sum: '$commission_amount' } } }
      ]);
      const totalRevenue = revenueRaw.length > 0 ? revenueRaw[0].total : 0;

      // Pending payouts using aggregation
      const pendingPayoutsRaw = await Payout.aggregate([
        { $match: { status: 'requested' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const pendingPayoutsAmount = pendingPayoutsRaw.length > 0 ? pendingPayoutsRaw[0].total : 0;

      // Recent applications
      const recentApplications = await Application.find()
        .limit(10)
        .sort({ createdAt: -1 })
        .populate('studentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email')
        .populate('recruitmentAgentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email agentId');

      // Pending agent approvals
      const pendingAgents = await Agent.countDocuments({ approvalStatus: 'pending' });

      const stats = {
        totalApplications,
        totalAgents,
        totalStudents,
        totalUniversities,
        totalCourses,
        totalRevenue,
        pendingPayouts: pendingPayoutsAmount,
        pendingAgents,
        applicationsByStatus,
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
      const agentIdString = req.userId.toString();
      const agentId = new mongoose.Types.ObjectId(agentIdString);

      // My students (either assigned or referred)
      const myStudents = await Student.countDocuments({
        $or: [
          { agentId: agentId },
          { referredBy: agentIdString }
        ]
      });

      // My applications
      const myApplications = await Application.countDocuments({ recruitmentAgentId: agentId });

      // Applications by status
      const applicationsByStatusRaw = await Application.aggregate([
        { $match: { recruitmentAgentId: agentId } },
        { $group: { _id: '$stage', count: { $sum: 1 } } }
      ]);

      const applicationsByStatus = applicationsByStatusRaw.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      // Earnings
      const earningsStats = await Commission.aggregate([
        { $match: { agentId } },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$commission_amount' },
            pendingEarnings: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$commission_amount', 0] }
            },
            approvedEarnings: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$commission_amount', 0] }
            },
            paidEarnings: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$commission_amount', 0] }
            }
          }
        }
      ]);

      const earnings = earningsStats.length > 0 ? earningsStats[0] : {
        totalEarnings: 0,
        pendingEarnings: 0,
        approvedEarnings: 0,
        paidEarnings: 0
      };

      // Recent applications
      const recentApplications = await Application.find({ recruitmentAgentId: agentId })
        .limit(10)
        .sort({ createdAt: -1 })
        .populate('studentId', 'firstName lastName email');

      const stats = {
        myStudents,
        myApplications,
        totalEarnings: earnings.totalEarnings,
        pendingEarnings: earnings.pendingEarnings,
        approvedEarnings: earnings.approvedEarnings,
        paidEarnings: earnings.paidEarnings,
        applicationsByStatus,
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
      const studentId = req.user.student?._id || req.user.id;

      // My applications
      const applications = await Application.find({ studentId })
        .sort({ createdAt: -1 })
        .populate('recruitmentAgentId', 'personalInfo.firstName personalInfo.lastName personalInfo.email agentId');

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
