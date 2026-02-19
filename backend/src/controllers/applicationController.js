const { Application, Student, Counter } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class ApplicationController {
  /**
   * Get Students without any applications (Pending)
   * GET /api/applications/pending-students
   */
  static async getPendingStudents(req, res) {
    try {
      const matchQuery = {};

      // If Agent, only show their students
      if (req.userRole === 'AGENT') {
        const agentIdString = req.userId.toString();
        const agentId = new mongoose.Types.ObjectId(agentIdString);
        matchQuery.$or = [
          { agentId: agentId },
          { referredBy: agentIdString }
        ];
      }

      const students = await Student.aggregate([
        {
          $match: {
            ...matchQuery,
            isCompleted: true
          }
        },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'studentId',
            as: 'apps'
          }
        },
        {
          $addFields: {
            isApplied: { $gt: [{ $size: '$apps' }, 0] }
          }
        },
        // Only show students who haven't applied yet
        { $match: { isApplied: false } },
        { $project: { password: 0, apps: 0 } }
      ]);

      return ResponseHandler.success(res, 'Pending students retrieved successfully', students);
    } catch (error) {
      logger.error('Get Pending Students Error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to fetch pending students', error);
    }
  }

  /**
   * Get Students with applications (Applied)
   * GET /api/applications/applied-students
   */
  static async getAppliedStudents(req, res) {
    try {
      const matchQuery = {};

      // If Agent, only show their students (created directly OR referred)
      if (req.userRole === 'AGENT') {
        const agentIdString = req.userId.toString();
        const agentId = new mongoose.Types.ObjectId(agentIdString);
        matchQuery.$or = [
          { agentId: agentId },
          { referredBy: agentIdString }
        ];
      }

      const students = await Student.aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'applications',
            localField: '_id',
            foreignField: 'studentId',
            as: 'applications'
          }
        },
        { $match: { 'applications.0': { $exists: true } } },
        {
          $addFields: {
            referredByObjId: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$referredBy", null] },
                    { $ne: ["$referredBy", ""] },
                    { $eq: [{ $strLenCP: "$referredBy" }, 24] } // Simple check for ObjectId length
                  ]
                },
                then: { $toObjectId: "$referredBy" },
                else: null
              }
            }
          }
        },
        {
          $lookup: {
            from: 'agents',
            localField: 'referredByObjId',
            foreignField: '_id',
            as: 'agentReferrer'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'referredByObjId',
            foreignField: '_id',
            as: 'userReferrer'
          }
        },
        {
          $addFields: {
            referredByName: {
              $cond: {
                if: { $gt: [{ $size: "$agentReferrer" }, 0] },
                then: { $concat: [{ $arrayElemAt: ["$agentReferrer.firstName", 0] }, " ", { $arrayElemAt: ["$agentReferrer.lastName", 0] }] },
                else: {
                  $cond: {
                    if: { $gt: [{ $size: "$userReferrer" }, 0] },
                    then: { $arrayElemAt: ["$userReferrer.name", 0] },
                    else: "Direct"
                  }
                }
              }
            },
            referredByRole: {
              $cond: {
                if: { $gt: [{ $size: "$agentReferrer" }, 0] },
                then: "Agent",
                else: {
                  $cond: {
                    if: { $gt: [{ $size: "$userReferrer" }, 0] },
                    then: { $arrayElemAt: ["$userReferrer.role", 0] },
                    else: "Direct"
                  }
                }
              }
            }
          }
        },
        { $project: { password: 0, agentReferrer: 0, userReferrer: 0, referredByObjId: 0 } }
      ]);

      return ResponseHandler.success(res, 'Applied students retrieved successfully', students);
    } catch (error) {
      logger.error('Get Applied Students Error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to fetch applied students', error);
    }
  }

  /**
   * Create new Application
   * POST /api/applications
   */
  static async createApplication(req, res) {
    try {
      const { studentId, programId, programSnapshot, notes } = req.body;

      // 1. Basic validation
      if (!studentId || !programId || !programSnapshot) {
        return ResponseHandler.badRequest(res, 'Missing required fields');
      }

      // 2. Authorization & Ownership Check
      const student = await Student.findById(studentId);
      if (!student) {
        return ResponseHandler.notFound(res, 'Student not found');
      }

      // Debug logging
      console.log('🔍 Ownership Check Debug:');
      console.log('  req.userRole:', req.userRole);
      console.log('  req.userId:', req.userId);
      console.log('  student.agentId:', student.agentId);
      console.log('  student.referredBy:', student.referredBy);
      console.log('  Match check (agentId):', student.agentId?.toString() === req.userId.toString());
      console.log('  Match check (referredBy):', student.referredBy?.toString() === req.userId.toString());

      // Check if agent owns this student (either created directly OR referred)
      if (req.userRole === 'AGENT') {
        const isOwner = student.agentId?.toString() === req.userId.toString();
        const isReferrer = student.referredBy?.toString() === req.userId.toString();

        if (!isOwner && !isReferrer) {
          return ResponseHandler.forbidden(res, 'You can only apply for your own students');
        }
      }

      // 3. Duplicate Check (Student + Program)
      const existingApp = await Application.findOne({ studentId, programId });
      if (existingApp) {
        return ResponseHandler.badRequest(res, 'Application already exists for this student and program');
      }

      // 4. Generate Application Number (APP-YYYY-XXXXX)
      const currentYear = new Date().getFullYear();
      const counterKey = `APP-${currentYear}`;

      const counter = await Counter.findOneAndUpdate(
        { id: counterKey },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const seqNumber = counter.seq.toString().padStart(5, '0');
      const applicationNo = `${counterKey}-${seqNumber}`;

      // 5. Create Application
      const application = await Application.create({
        applicationNo,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        recruitmentAgentId: student.agentId || req.userId,
        programId,
        programSnapshot,
        notes,
        stage: 'Pre-Payment',
        paymentStatus: 'unpaid'
      });

      // 6. Audit & Logging
      await AuditService.logCreate(req.user, 'Application', application._id, application.toJSON(), req);
      logger.info('Application created', { applicationNo, studentId, agentId: req.userId });

      return ResponseHandler.created(res, 'Application submitted successfully', application);
    } catch (error) {
      logger.error('Create Application Error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to create application', error);
    }
  }

  /**
   * Get all Applications with filters
   * GET /api/applications
   */
  static async getApplications(req, res) {
    try {
      const { page = 1, limit = 10, stage, paymentStatus } = req.query;
      const skip = (page - 1) * limit;

      const query = {};
      if (stage) query.stage = stage;
      if (paymentStatus) query.paymentStatus = paymentStatus;

      // Role-based filtering
      if (req.userRole === 'AGENT') {
        query.recruitmentAgentId = req.userId;
      } else if (req.userRole === 'STUDENT') {
        query.studentId = req.userId;
      }

      const totalItems = await Application.countDocuments(query);
      const applications = await Application.find(query)
        .populate('studentId', 'firstName lastName email passportNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      return ResponseHandler.paginated(res, 'Applications retrieved', applications, {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems
      });
    } catch (error) {
      logger.error('Get Applications Error', { error: error.message });
      return ResponseHandler.serverError(res, 'Failed to fetch applications', error);
    }
  }
}

module.exports = ApplicationController;
