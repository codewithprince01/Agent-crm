const Student = require('../models/Student');
const Agent = require('../models/Agent');
const User = require('../models/User');
const Application = require('../models/Application');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { moveFileToEntityFolder, sanitize } = require('../services/storageService');
const AuditService = require('../services/auditService');

class StudentController {
  /**
   * Helper to resolve referrer names and roles
   */
  static async resolveReferrerNames(referredByIds) {
    const uniqueIds = [...new Set(referredByIds.filter(id => id && mongoose.isValidObjectId(id)))];

    if (uniqueIds.length === 0) return {};

    const [agents, users] = await Promise.all([
      Agent.find({ _id: { $in: uniqueIds } }).select('firstName lastName').lean(),
      User.find({ _id: { $in: uniqueIds } }).select('name role').lean()
    ]);

    const resultMap = {};

    // Process Agents
    agents.forEach(a => {
      resultMap[a._id.toString()] = {
        name: `${a.firstName || ''} ${a.lastName || ''}`.trim(),
        role: 'Agent'
      };
    });

    // Process Users (Admins/Super Admins)
    users.forEach(u => {
      resultMap[u._id.toString()] = {
        name: u.name || 'Unknown Admin',
        role: u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'
      };
    });

    return resultMap;
  }

  /**
   * Get all students
   * GET /api/students
   */
  static async getAllStudents(req, res) {
    try {
      const { page = 1, limit = 100, search, startDate, endDate, role, gender } = req.query;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};

      // ROLE BASED FILTERING: 
      // Agents see ALL their own students (completed or not)
      // Admins see all COMPLETED students by default
      if (req.userRole === 'AGENT') {
        const agentIdString = req.userId.toString();
        query.$or = [
          { agentId: new mongoose.Types.ObjectId(agentIdString) },
          { referredBy: agentIdString }
        ];
      } else {
        query.isCompleted = true;
      }

      // Add search functionality (ensuring it doesn't overwrite agent filter)
      if (search) {
        const searchFilter = {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { studentId: { $regex: search, $options: 'i' } }
          ]
        };

        if (query.$or) {
          // If we already have an $or (from agent filter), we must use $and
          const agentFilter = { $or: query.$or };
          delete query.$or;
          query.$and = [agentFilter, searchFilter];
        } else {
          query.$or = searchFilter.$or;
        }
      }

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      // Role filter
      if (role && role !== 'All') {
        if (role === 'Direct') {
          query.referredBy = { $in: [null, ''] };
        } else if (role === 'Agent') {
          const agents = await Agent.find().select('_id').lean();
          query.referredBy = { $in: agents.map(a => a._id.toString()) };
        } else if (role === 'Admin' || role === 'Super Admin') {
          const mRole = role === 'Super Admin' ? 'SUPER_ADMIN' : 'ADMIN';
          const users = await User.find({ role: mRole }).select('_id').lean();
          query.referredBy = { $in: users.map(u => u._id.toString()) };
        }
      }

      // Gender filter
      if (gender && gender !== 'All') {
        query.gender = gender;
      }

      // Get students
      const students = await Student.find(query)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const count = await Student.countDocuments(query);

      // Resolve referrer names and roles using helper
      const referrerIds = students.map(s => s.referredBy).filter(Boolean);
      const referrerMap = await StudentController.resolveReferrerNames(referrerIds);

      // Check which students have applications
      // Check which students have applications and count them
      const studentIds = students.map(s => s._id);

      const applicationCounts = await Application.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        { $group: { _id: '$studentId', count: { $sum: 1 } } }
      ]);

      const countMap = {};
      applicationCounts.forEach(app => {
        countMap[app._id.toString()] = app.count;
      });

      // Map to frontend-friendly format
      const formattedStudents = students.map(student => {
        const refInfo = student.referredBy ? referrerMap[student.referredBy.toString()] : null;
        const appCount = countMap[student._id.toString()] || 0;

        return {
          _id: student._id,
          id: student._id,
          studentId: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          mobile: student.phone,
          phone: student.phone,
          gender: student.gender,
          nationality: student.nationality,
          country: student.country,
          referredBy: student.referredBy,
          referredByName: refInfo ? refInfo.name : (student.referredBy ? 'Unknown' : 'Direct'),
          referredByRole: refInfo ? refInfo.role : (student.referredBy ? 'N/A' : 'Direct'),
          isApplied: appCount > 0,
          applicationCount: appCount,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt
        };
      });

      return res.status(200).json({
        success: true,
        data: formattedStudents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalItems: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get students error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get students',
        error: error.message
      });
    }
  }

  /**
   * Get student by ID
   * GET /api/students/:id
   */
  static async getStudentById(req, res) {
    try {
      const { id } = req.params;

      let query = {};
      if (mongoose.isValidObjectId(id)) {
        query = { $or: [{ _id: id }, { studentId: id }, { tempStudentId: id }] };
      } else {
        query = { $or: [{ studentId: id }, { tempStudentId: id }] };
      }

      const student = await Student.findOne(query).select('-password -__v');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Authorization check: Agents can only view students they referred
      if (req.userRole === 'AGENT' && student.referredBy?.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access to student details'
        });
      }

      // Resolve referrer name for single student
      const referrerMap = await StudentController.resolveReferrerNames([student.referredBy]);
      const refInfo = student.referredBy ? referrerMap[student.referredBy.toString()] : null;
      // Fetch applications for this student
      const applications = await Application.find({ studentId: id }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: {
          student: {
            ...student.toObject({ getters: true, virtuals: true }),
            documents: Object.fromEntries(student.documents || new Map()),
            referredByName: refInfo ? refInfo.name : (student.referredBy ? 'Unknown' : 'Direct'),
            referredByRole: refInfo ? refInfo.role : (student.referredBy ? 'N/A' : 'Direct'),
            applications // Include applications in the response
          }
        }
      });
    } catch (error) {
      console.error('Get student error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get student',
        error: error.message
      });
    }
  }

  /**
   * Get current student's own profile (for logged in students)
   * GET /api/students/me
   */
  static async getMyProfile(req, res) {
    try {
      // req.user is already populated by authMiddleware and contains the student data
      const student = req.user;

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      // Remove sensitive referral data before sending to student
      const studentData = student.toObject({ getters: true, virtuals: true });
      delete studentData.referredBy;
      delete studentData.referredByName;
      delete studentData.referredByRole;
      delete studentData.password;
      delete studentData.__v;

      return res.status(200).json({
        success: true,
        data: {
          student: {
            ...studentData,
            documents: Object.fromEntries(student.documents || new Map())
          }
        }
      });
    } catch (error) {
      console.error('Get my profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  /**
   * Update current student's own profile
   * PUT /api/students/me
   */
  static async updateMyProfile(req, res) {
    try {
      const studentId = req.user._id;
      const updateData = req.body;

      // Remove fields that shouldn't be updated by student
      delete updateData.password;
      delete updateData.email; // Email shouldn't be changed directly
      delete updateData.referredBy;
      delete updateData.referredByName;
      delete updateData.referredByRole;
      delete updateData.isEmailVerified;
      delete updateData.role;
      delete updateData._id;

      // Update student
      const student = await Student.findByIdAndUpdate(
        studentId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Remove sensitive data
      const studentData = student.toObject({ getters: true, virtuals: true });
      delete studentData.referredBy;
      delete studentData.referredByName;
      delete studentData.referredByRole;
      delete studentData.password;
      delete studentData.__v;

      // Log audit
      await AuditService.logUpdate(req.user, 'Student', student._id, {}, updateData, req);

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          student: studentData
        }
      });
    } catch (error) {
      console.error('Update my profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }

  /**
   * Delete student
   * DELETE /api/students/:id
   */
  static async deleteStudent(req, res) {
    try {
      const { id } = req.params;

      const student = await Student.findById(id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Authorization check (Agents only delete their own students)
      if (req.userRole === 'AGENT') {
        const agentIdString = req.userId.toString();
        const isOwner = student.referredBy?.toString() === agentIdString ||
          student.agentId?.toString() === agentIdString;

        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'Unauthorized: You can only delete students you referred'
          });
        }
      }

      // Delete student documents folder
      // Delete student documents folder
      const fs = require('fs');
      const path = require('path');
      // sanitize is imported at the top of the file

      try {
        const baseUploadPath = 'uploads/documents/students';
        let deleted = false;

        // 1. Try Standardized Name_Email format (New Standard)
        if (student.email) {
          const entityName = sanitize(student.firstName + ' ' + student.lastName);
          const safeEmail = sanitize(student.email);
          const emailFolder = `${entityName}_${safeEmail}`;
          const emailPath = path.join(process.cwd(), baseUploadPath, emailFolder);

          if (fs.existsSync(emailPath)) {
            fs.rmSync(emailPath, { recursive: true, force: true });
            console.log(`Deleted folder (Email): ${emailPath}`);
            deleted = true;
          }

          // Also try "Simple Replace" format (Legacy/Mixed)
          // Some controllers might have used simple replace instead of sanitize
          if (!deleted) {
            const simpleSafeName = `${student.firstName}_${student.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
            const simpleSafeEmail = student.email.replace(/[^a-zA-Z0-9]/g, '_');
            const simpleEmailFolder = `${simpleSafeName}_${simpleSafeEmail}`;
            const simpleEmailPath = path.join(process.cwd(), baseUploadPath, simpleEmailFolder);
            if (fs.existsSync(simpleEmailPath)) {
              fs.rmSync(simpleEmailPath, { recursive: true, force: true });
              console.log(`Deleted folder (Simple Email): ${simpleEmailPath}`);
              deleted = true;
            }
          }
        }

        // 2. Legacy: TempId (Public Drafts)
        if (!deleted && student.tempStudentId) {
          const safeName = `${student.firstName}_${student.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
          const tempFolder = `${safeName}_${student.tempStudentId}`;
          const tempFullPath = path.join(process.cwd(), baseUploadPath, tempFolder);
          if (fs.existsSync(tempFullPath)) {
            fs.rmSync(tempFullPath, { recursive: true, force: true });
            console.log(`Deleted temp folder: ${tempFullPath}`);
            deleted = true;
          }
        }

        // 3. Legacy: MongoDB ID (Old Manual Uploads)
        if (!deleted) {
          const entityName = sanitize(student.firstName + ' ' + student.lastName);
          const entityId = student._id.toString();
          const idFolder = `${entityName}_${entityId}`;
          const idFullPath = path.join(process.cwd(), baseUploadPath, idFolder);
          if (fs.existsSync(idFullPath)) {
            fs.rmSync(idFullPath, { recursive: true, force: true });
            console.log(`Deleted ID folder: ${idFullPath}`);
          }
        }

      } catch (err) {
        console.error('Error deleting student document folder:', err);
      }

      await Student.findByIdAndDelete(id);

      // Log audit
      await AuditService.logDelete(req.user, 'Student', id, {
        studentName: `${student.firstName} ${student.lastName}`,
        email: student.email
      }, req);

      return res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      console.error('Delete student error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete student',
        error: error.message
      });
    }
  }

  /**
   * Create student (Admin/Agent Manual Creation)
   * POST /api/students
   */
  static async createStudent(req, res) {
    try {
      const {
        name,
        firstName,
        lastName,
        email,
        phone,
        password = 'Student@123',
        dateOfBirth,
        gender,
        nationality,
        passportNumber,
        passportExpiry,
        maritalStatus,
        address,
        city,
        state,
        country,
        postalCode,
        homeContactNumber,
        referredBy,
        // Education
        educationCountry,
        highestLevel,
        gradingScheme,
        gradeAverage,
        // Test Scores
        examType,
        examDate,
        listeningScore,
        readingScore,
        writingScore,
        speakingScore,
        overallScore,
        // Background
        visaRefusal,
        studyPermit,
        backgroundDetails
      } = req.body;

      // Check if email exists
      const existingStudent = await Student.findOne({ email: email.toLowerCase() });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Generate student ID
      const generateStudentId = () => {
        const prefix = 'STU';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${timestamp}${random}`;
      };

      // Generate setup token (expires in 24 hours)
      const crypto = require('crypto');
      const setupToken = crypto.randomBytes(32).toString('hex');
      const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create student
      const student = new Student({
        studentId: generateStudentId(),
        firstName: firstName || name?.split(' ')[0],
        lastName: lastName || name?.split(' ').slice(1).join(' '),
        email: email.toLowerCase(),
        phone,
        // System generated students don't have password yet, they set it via link
        isPasswordSet: false,
        passwordSetupToken: setupToken,
        passwordSetupExpires: tokenExpires,
        dateOfBirth,
        gender,
        nationality,
        passportNumber,
        passportExpiry,
        maritalStatus,
        address,
        city,
        state,
        country,
        postalCode,
        homeContactNumber,
        referredBy: req.userRole === 'AGENT' ? req.userId : (referredBy || null),
        agentId: req.userRole === 'AGENT' ? req.userId : (referredBy || null), // Set both for consistency
        isCompleted: true, // Manual creation is always completed
        isDraft: false,
        isEmailVerified: true, // Admin created students don't need email verification
        emailVerifiedAt: new Date(),
        // New Fields
        educationCountry,
        highestLevel,
        gradingScheme,
        gradeAverage,
        examType,
        examDate,
        listeningScore,
        readingScore,
        writingScore,
        speakingScore,
        overallScore,
        visaRefusal,
        studyPermit,
        backgroundDetails
      });

      await student.save();

      // Log audit
      await AuditService.logCreate(req.user, 'Student', student._id, {
        studentName: `${student.firstName} ${student.lastName}`,
        email: student.email,
        studentId: student.studentId
      }, req);

      // Send welcome email with setup link
      const emailService = require('../services/emailService');
      await emailService.sendStudentWelcomeEmail(student, setupToken);

      console.log('Student created manually and welcome email sent:', student.studentId);

      return res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: { student: student.toObject({ getters: true, virtuals: false }) }
      });
    } catch (error) {
      console.error('Create student error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create student',
        error: error.message
      });
    }
  }

  /**
   * Update student
   * PUT /api/students/:id
   */
  static async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.password;
      delete updateData.studentId;
      delete updateData._id;

      const student = await Student.findById(id);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Authorization check: Agents can only update students they referred or are assigned to
      if (req.userRole === 'AGENT') {
        const agentIdString = req.userId.toString();
        const isOwner = student.referredBy?.toString() === agentIdString ||
          student.agentId?.toString() === agentIdString;

        if (!isOwner) {
          return res.status(403).json({
            success: false,
            message: 'Unauthorized: You can only update students you referred'
          });
        }
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -__v');

      // Log audit
      await AuditService.logUpdate(req.user, 'Student', id, {}, updateData, req);

      console.log('Student updated:', id);

      return res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: { student: updatedStudent }
      });
    } catch (error) {
      console.error('Update student error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update student',
        error: error.message
      });
    }
  }

  /**
   * Upload student document
   * POST /api/students/:id/documents
   */
  static async uploadDocument(req, res) {
    try {
      const { id } = req.params;
      const documentName = (req.body.documentName || '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const student = await Student.findById(id);
      if (!student) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Authorization check (same as before)
      if (req.userRole === 'AGENT') {
        const agentIdString = req.userId.toString();
        const isOwner = student.referredBy?.toString() === agentIdString ||
          student.agentId?.toString() === agentIdString;

        if (!isOwner) {
          if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
          return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
      }

      // 1. Handle Overwrite: Delete old file if exists
      if (student.documents && student.documents.has(documentName)) {
        const oldRelativePath = student.documents.get(documentName);
        const oldFullPath = path.join(process.cwd(), oldRelativePath);
        try {
          if (fs.existsSync(oldFullPath)) fs.unlinkSync(oldFullPath);
        } catch (err) {
          console.error('Failed to delete old file:', err);
        }
      }

      // 2. Clear potential duplicate logic:
      // We already handle overwrite by deleting student.documents.get(documentName) path above.
      // This works even if the old path was in a dated folder and the new one is not.

      const relativePath = moveFileToEntityFolder(file, student, documentName, 'students');

      if (!student.documents) student.documents = new Map();
      student.documents.set(documentName, relativePath);
      student.markModified('documents');
      await student.save();

      // Log audit
      await AuditService.logUpdate(req.user, 'Student', id, { action: 'upload_document', document: documentName }, {}, req);

      console.log('Document uploaded for student:', id);

      return res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          student,
          documents: Object.fromEntries(student.documents),
          document: {
            documentName: documentName,
            documentUrl: relativePath,
            verified: false
          }
        }
      });
    } catch (error) {
      console.error('Upload document error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message
      });
    }
  }

  /**
   * Upload current student's own document
   * POST /api/students/me/documents
   */
  static async uploadMyDocument(req, res) {
    try {
      const documentName = (req.body.documentName || '').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const student = await Student.findById(req.userId);
      if (!student) {
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // 1. Handle Overwrite
      if (student.documents && student.documents.has(documentName)) {
        const oldRelativePath = student.documents.get(documentName);
        const oldFullPath = path.join(process.cwd(), oldRelativePath);
        try { if (fs.existsSync(oldFullPath)) fs.unlinkSync(oldFullPath); } catch (e) { }
      }

      const relativePath = moveFileToEntityFolder(file, student, documentName, 'students');

      if (!student.documents) student.documents = new Map();
      student.documents.set(documentName, relativePath);
      student.markModified('documents');
      await student.save();

      // Log audit
      await AuditService.logUpdate(student, 'Student', student._id, { action: 'upload_document_by_student', document: documentName }, {}, req);

      return res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          student,
          documents: Object.fromEntries(student.documents)
        }
      });

      console.log('Document uploaded by student:', student._id);
    } catch (error) {
      console.error('Upload my document error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload document',
        error: error.message
      });
    }
  }

  /**
   * Delete student document
   * DELETE /api/students/:id/documents/:documentName
   */
  static async deleteDocument(req, res) {
    try {
      const { id, documentName } = req.params;

      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Authorization check
      if (req.userRole === 'AGENT') {
        const agentIdString = req.userId.toString();
        const isOwner = student.referredBy?.toString() === agentIdString ||
          student.agentId?.toString() === agentIdString;

        if (!isOwner) {
          return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
      }

      if (!student.documents || !student.documents.get(documentName)) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const filePath = student.documents.get(documentName);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.error('File delete error:', err);
      }

      student.documents.delete(documentName);
      student.markModified('documents');
      await student.save();

      // Log audit
      await AuditService.logUpdate(req.user, 'Student', id, { action: 'delete_document', document: documentName }, {}, req);

      return res.status(200).json({ success: true, message: 'Document deleted successfully', data: { documents: student.documents } });
    } catch (error) {
      console.error('Delete document error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete document', error: error.message });
    }
  }
  /**
   * Delete current student's own document
   * DELETE /api/students/me/documents/:documentName
   */
  static async deleteMyDocument(req, res) {
    try {
      const { documentName } = req.params;
      const studentId = req.userId;

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      if (!student.documents || !student.documents.get(documentName)) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const filePath = student.documents.get(documentName);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (err) {
        console.error('File delete error:', err);
      }

      student.documents.delete(documentName);
      student.markModified('documents');
      await student.save();

      return res.status(200).json({ success: true, message: 'Document deleted successfully', data: { documents: student.documents } });
    } catch (error) {
      console.error('Delete my document error:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete document', error: error.message });
    }
  }

  /**
   * Upload multiple student documents
   * POST /api/students/:id/documents/bulk
   */
  static async uploadBulkDocuments(req, res) {
    try {
      const { id } = req.params;
      const files = req.files;

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const student = await Student.findById(id);
      if (!student) {
        Object.values(files).flat().forEach(file => {
          if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      // Authorization check
      if (req.userRole === 'AGENT') {
        const agentIdString = req.userId.toString();
        const isOwner = student.referredBy?.toString() === agentIdString ||
          student.agentId?.toString() === agentIdString;

        if (!isOwner) {
          Object.values(files).flat().forEach(file => {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
          });
          return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
      }

      const uploadedDocs = {};
      for (const [fieldName, fileArray] of Object.entries(files)) {
        const file = fileArray[0];

        // Handle Overwrite
        if (student.documents && student.documents.has(fieldName)) {
          const oldRelativePath = student.documents.get(fieldName);
          const oldFullPath = path.join(process.cwd(), oldRelativePath);
          try { if (fs.existsSync(oldFullPath)) fs.unlinkSync(oldFullPath); } catch (e) { }
        }

        const relativePath = moveFileToEntityFolder(file, student, fieldName, 'students');

        if (!student.documents) student.documents = new Map();
        student.documents.set(fieldName, relativePath);
        uploadedDocs[fieldName] = relativePath;
      }

      student.markModified('documents');
      await student.save();

      // Log audit
      await AuditService.logUpdate(req.user, 'Student', id, { action: 'bulk_upload_documents', documents: Object.keys(uploadedDocs) }, {}, req);

      return res.status(200).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: {
          student,
          documents: Object.fromEntries(student.documents)
        }
      });
    } catch (error) {
      if (req.files) {
        Object.values(req.files).flat().forEach(file => {
          try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (e) { }
        });
      }
      console.error('Bulk upload student docs error:', error);
      return res.status(500).json({ success: false, message: 'Failed to upload documents', error: error.message });
    }
  }
}

module.exports = StudentController;
