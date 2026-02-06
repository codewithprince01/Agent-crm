const Student = require('../models/Student');
const Agent = require('../models/Agent');
const User = require('../models/User');
const mongoose = require('mongoose');

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

      // Build query - only show completed registrations
      const query = { isCompleted: true };

      // Add search functionality
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } }
        ];
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

      // Map to frontend-friendly format
      const formattedStudents = students.map(student => {
        const refInfo = student.referredBy ? referrerMap[student.referredBy.toString()] : null;
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

      const student = await Student.findById(id).select('-password -__v');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Resolve referrer name for single student
      const referrerMap = await StudentController.resolveReferrerNames([student.referredBy]);
      const refInfo = student.referredBy ? referrerMap[student.referredBy.toString()] : null;

      return res.status(200).json({
        success: true,
        data: {
          student: {
            ...student.toObject({ getters: true, virtuals: true }),
            referredByName: refInfo ? refInfo.name : (student.referredBy ? 'Unknown' : 'Direct'),
            referredByRole: refInfo ? refInfo.role : (student.referredBy ? 'N/A' : 'Direct')
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

      await Student.findByIdAndDelete(id);

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
        address,
        city,
        country,
        postalCode,
        referredBy
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
        address,
        city,
        country,
        postalCode,
        referredBy,
        isCompleted: true, // Manual creation is always completed
        isDraft: false,
        isEmailVerified: true, // Admin created students don't need email verification
        emailVerifiedAt: new Date()
      });

      await student.save();

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

      const student = await Student.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password -__v');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      console.log('Student updated:', id);

      return res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: { student }
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
      const { document_type } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // For now, just return success
      // TODO: Implement document storage if needed
      console.log('Document uploaded for student:', id);

      return res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          document: {
            student_id: id,
            document_type,
            file_name: file.originalname,
            file_path: file.path,
            file_size: file.size
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
}

module.exports = StudentController;
