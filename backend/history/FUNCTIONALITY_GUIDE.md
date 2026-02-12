# Backend Functionality Guide

**Project:** Agent CRM - Backend API  
**Document Type:** Functionality & Code Management Guide  
**Created:** 2026-02-12

---

## Table of Contents
1. [Controllers Functionality](#controllers-functionality)
2. [Models & Database](#models--database)
3. [Services Layer](#services-layer)
4. [Middleware Functions](#middleware-functions)
5. [Routes Configuration](#routes-configuration)
6. [Utilities](#utilities)
7. [How Code is Managed](#how-code-is-managed)

---

## Controllers Functionality

### 1. **authController.js** - Authentication & Authorization

#### Purpose
Handles all authentication-related operations including login, registration, password reset, and email verification.

#### Key Functions

**register()**
```javascript
// Purpose: Register new agent
// Flow:
async register(req, res) {
  // 1. Validate input data
  const { email, password, personalInfo, businessInfo } = req.body;
  
  // 2. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ error: 'User exists' });
  
  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 4. Create user account
  const user = await User.create({
    email,
    password: hashedPassword,
    role: 'AGENT',
    status: 'inactive' // Requires admin approval
  });
  
  // 5. Create agent profile
  const agent = await Agent.create({
    userId: user._id,
    personalInfo,
    businessInfo,
    status: 'inactive'
  });
  
  // 6. Generate verification token
  const verificationToken = generateToken(user._id);
  
  // 7. Send verification email
  await emailService.sendVerificationEmail(email, verificationToken);
  
  // 8. Return success
  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify email.'
  });
}
```

**login()**
```javascript
// Purpose: Authenticate user and issue JWT token
async login(req, res) {
  const { email, password } = req.body;
  
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  // 2. Check account status
  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Account inactive' });
  }
  
  // 3. Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
  
  // 4. Generate JWT token
  const token = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // 5. Fetch user profile (agent/admin data)
  const profile = await getProfileByRole(user);
  
  // 6. Log login activity
  await auditService.log({
    userId: user._id,
    action: 'LOGIN',
    ipAddress: req.ip
  });
  
  // 7. Return token and user data
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      profile
    }
  });
}
```

**forgotPassword()**
```javascript
// Purpose: Initiate password reset process
async forgotPassword(req, res) {
  const { email } = req.body;
  
  // 1. Find user
  const user = await User.findOne({ email });
  if (!user) {
    // Return success even if user doesn't exist (security)
    return res.json({ success: true, message: 'Reset email sent' });
  }
  
  // 2. Generate reset token (expires in 1 hour)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();
  
  // 3. Send reset email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  await emailService.sendPasswordResetEmail(email, resetUrl);
  
  res.json({ success: true, message: 'Reset email sent' });
}
```

---

### 2. **agentController.js** - Agent Management

#### getAllAgents()
```javascript
// Purpose: Retrieve all agents with filtering and pagination
// Access: SUPER_ADMIN, ADMIN
async getAllAgents(req, res) {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  // Build query
  const query = {};
  
  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }
  
  // Search filter (name, email, agentId)
  if (search) {
    query.$or = [
      { agentId: new RegExp(search, 'i') },
      { 'personalInfo.firstName': new RegExp(search, 'i') },
      { 'personalInfo.lastName': new RegExp(search, 'i') },
      { 'personalInfo.email': new RegExp(search, 'i') }
    ];
  }
  
  // Execute query
  const agents = await Agent.find(query)
    .populate('userId', 'email role status')
    .populate('referralInfo.referredBy', 'agentId personalInfo.firstName personalInfo.lastName')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });
  
  // Get total count
  const total = await Agent.countDocuments(query);
  
  res.json({
    success: true,
    data: agents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}
```

#### createAgent()
```javascript
// Purpose: Create new agent (admin-initiated)
// Access: SUPER_ADMIN, ADMIN
async createAgent(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { personalInfo, businessInfo, bankDetails } = req.body;
    
    // 1. Generate temporary password
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    // 2. Create user account
    const user = await User.create([{
      email: personalInfo.email,
      password: hashedPassword,
      role: 'AGENT',
      status: 'active' // Admin-created agents are active by default
    }], { session });
    
    // 3. Generate unique agent ID
    const agentId = await generateAgentId();
    
    // 4. Generate referral code
    const referralCode = generateReferralCode();
    
    // 5. Create agent profile
    const agent = await Agent.create([{
      agentId,
      userId: user[0]._id,
      personalInfo,
      businessInfo,
      bankDetails,
      referralInfo: {
        referralCode,
        referredBy: req.body.referredBy || null
      },
      status: 'active',
      createdBy: req.user.userId
    }], { session });
    
    // 6. Send welcome email with credentials
    await emailService.sendAgentWelcomeEmail(
      personalInfo.email,
      {
        name: `${personalInfo.firstName} ${personalInfo.lastName}`,
        agentId,
        tempPassword,
        loginUrl: process.env.FRONTEND_URL + '/login'
      }
    );
    
    // 7. Log activity
    await auditService.log({
      userId: req.user.userId,
      action: 'CREATE_AGENT',
      resourceId: agent[0]._id,
      details: { agentId }
    }, session);
    
    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: agent[0],
      message: 'Agent created successfully'
    });
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

#### updateAgent()
```javascript
// Purpose: Update agent information
// Access: SUPER_ADMIN, ADMIN (any agent), AGENT (own profile)
async updateAgent(req, res) {
  const { id } = req.params;
  const updates = req.body;
  
  // 1. Check permissions
  if (req.user.role === 'AGENT') {
    // Agents can only update their own profile
    const agent = await Agent.findOne({ userId: req.user.userId });
    if (agent._id.toString() !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Agents cannot update certain fields
    delete updates.status;
    delete updates.verificationStatus;
    delete updates.createdBy;
  }
  
  // 2. Update agent
  const agent = await Agent.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('userId', 'email role');
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  // 3. Log activity
  await auditService.log({
    userId: req.user.userId,
    action: 'UPDATE_AGENT',
    resourceId: agent._id,
    changes: updates
  });
  
  res.json({
    success: true,
    data: agent
  });
}
```

---

### 3. **studentController.js** - Student Management

#### createStudent()
```javascript
// Purpose: Create new student record
// Access: SUPER_ADMIN, ADMIN, AGENT
async createStudent(req, res) {
  const studentData = req.body;
  
  // 1. Determine agent
  let agentId;
  if (req.user.role === 'AGENT') {
    // For agents, use their own ID
    const agent = await Agent.findOne({ userId: req.user.userId });
    agentId = agent._id;
  } else {
    // For admins, use provided agentId
    agentId = studentData.agentId;
  }
  
  // 2. Generate student ID
  const studentId = await generateStudentId();
  
  // 3. Create student
  const student = await Student.create({
    studentId,
    agentId,
    ...studentData,
    createdBy: req.user.userId
  });
  
  // 4. Send welcome email to student
  if (studentData.personalInfo?.email) {
    await emailService.sendStudentWelcomeEmail(
      studentData.personalInfo.email,
      {
        name: `${studentData.personalInfo.firstName} ${studentData.personalInfo.lastName}`,
        studentId,
        agentName: await getAgentName(agentId)
      }
    );
  }
  
  // 5. Notify agent
  await emailService.sendStudentCreatedNotification(agentId, student);
  
  res.status(201).json({
    success: true,
    data: student
  });
}
```

#### getStudentById()
```javascript
// Purpose: Get detailed student information
// Access: Role-based (agents see only their students)
async getStudentById(req, res) {
  const { id } = req.params;
  
  // Build query
  const query = { _id: id };
  
  // If agent, restrict to own students
  if (req.user.role === 'AGENT') {
    const agent = await Agent.findOne({ userId: req.user.userId });
    query.agentId = agent._id;
  }
  
  // Fetch student with related data
  const student = await Student.findOne(query)
    .populate('agentId', 'agentId personalInfo')
    .populate({
      path: 'applications',
      populate: {
        path: 'universityId courseId',
        select: 'name'
      }
    });
  
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  
  res.json({
    success: true,
    data: student
  });
}
```

#### uploadDocument()
```javascript
// Purpose: Upload student document
// Uses: Multer middleware for file handling
async uploadDocument(req, res) {
  const { id } = req.params;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // 1. Validate file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file type' });
  }
  
  // 2. Create document record
  const document = {
    name: req.body.documentName || file.originalname,
    type: req.body.documentType,
    filename: file.filename,
    path: file.path,
    size: file.size,
    uploadedBy: req.user.userId,
    uploadedAt: new Date()
  };
  
  // 3. Add to student record
  const student = await Student.findByIdAndUpdate(
    id,
    { $push: { documents: document } },
    { new: true }
  );
  
  res.json({
    success: true,
    data: document
  });
}
```

---

### 4. **applicationController.js** - Application Processing

#### createApplication()
```javascript
// Purpose: Create student application
async createApplication(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { studentId, universityId, courseId, documents } = req.body;
    
    // 1. Validate student exists
    const student = await Student.findById(studentId).session(session);
    if (!student) throw new Error('Student not found');
    
    // 2. Get course details for commission calculation
    const course = await Course.findById(courseId).session(session);
    const university = await University.findById(universityId).session(session);
    
    // 3. Generate application ID
    const applicationId = await generateApplicationId();
    
    // 4. Calculate commission
    const commissionRule = await CommissionRule.findOne({
      universityId,
      courseId
    }).session(session);
    
    const commissionAmount = course.tuitionFee * (commissionRule.rate / 100);
    
    // 5. Create application
    const application = await Application.create([{
      applicationId,
      studentId,
      agentId: student.agentId,
      universityId,
      courseId,
      status: 'draft',
      tuitionFee: course.tuitionFee,
      commissionRate: commissionRule.rate,
      commissionAmount,
      documents,
      timeline: [{
        status: 'draft',
        date: new Date(),
        note: 'Application created',
        updatedBy: req.user.userId
      }]
    }], { session });
    
    // 6. Create commission record
    await Commission.create([{
      agentId: student.agentId,
      applicationId: application[0]._id,
      amount: commissionAmount,
      status: 'pending'
    }], { session });
    
    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: application[0]
    });
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

#### updateApplicationStatus()
```javascript
// Purpose: Update application status
// Triggers: Commission approval, notifications
async updateApplicationStatus(req, res) {
  const { id } = req.params;
  const { status, note } = req.body;
  
  // 1. Get current application
  const application = await Application.findById(id)
    .populate('agentId', 'personalInfo.email')
    .populate('studentId', 'personalInfo');
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  // 2. Update status
  application.status = status;
  application.timeline.push({
    status,
    date: new Date(),
    note,
    updatedBy: req.user.userId
  });
  
  await application.save();
  
  // 3. Handle commission based on status
  if (status === 'approved') {
    await Commission.updateOne(
      { applicationId: id },
      { status: 'approved', approvedDate: new Date() }
    );
    
    // Notify agent of commission approval
    await emailService.sendCommissionApprovalEmail(application.agentId);
  }
  
  // 4. Send notifications
  await emailService.sendApplicationStatusUpdateEmail(
    application.studentId.personalInfo.email,
    {
      studentName: application.studentId.personalInfo.firstName,
      status,
      applicationId: application.applicationId
    }
  );
  
  res.json({
    success: true,
    data: application
  });
}
```

---

### 5. **dashboardController.js** - Analytics & Statistics

#### getSuperAdminStats()
```javascript
// Purpose: Get dashboard statistics for super admin
async getSuperAdminStats(req, res) {
  const stats = {};
  
  // 1. Total counts
  stats.totalAgents = await Agent.countDocuments({ status: 'active' });
  stats.totalStudents = await Student.countDocuments();
  stats.totalApplications = await Application.countDocuments();
  
  // 2. Status breakdowns
  stats.agentsByStatus = await Agent.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  stats.applicationsByStatus = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  
  // 3. Revenue calculations
  stats.totalRevenue = await Commission.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  stats.pendingCommissions = await Commission.aggregate([
    { $match: { status: { $in: ['pending', 'approved'] } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  // 4. Recent activities
  stats.recentActivities = await AuditLog.find()
    .sort({ timestamp: -1 })
    .limit(10)
    .populate('userId', 'email role');
  
  // 5. Monthly trends
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  stats.monthlyRegistrations = await Agent.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  stats.monthlyApplications = await Application.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  // 6. Top performing agents
  stats.topAgents = await Student.aggregate([
    {
      $group: {
        _id: '$agentId',
        studentCount: { $sum: 1 }
      }
    },
    { $sort: { studentCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'agents',
        localField: '_id',
        foreignField: '_id',
        as: 'agentInfo'
      }
    }
  ]);
  
  res.json({
    success: true,
    data: stats
  });
}
```

---

## Models & Database

### Model Structure & Hooks

#### Agent.js
```javascript
const agentSchema = new mongoose.Schema({
  agentId: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personalInfo: { /* ... */ },
  businessInfo: { /* ... */ },
  bankDetails: { /* ... */ },
  referralInfo: {
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
    referralCode: { type: String, unique: true }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: Get students
agentSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'agentId'
});

// Pre-save: Generate agent ID
agentSchema.pre('save', async function(next) {
  if (!this.agentId) {
    this.agentId = await generateAgentId();
  }
  if (!this.referralInfo.referralCode) {
    this.referralInfo.referralCode = generateReferralCode();
  }
  next();
});

// Pre-remove: Cascade delete or prevent
agentSchema.pre('remove', async function(next) {
  const studentCount = await mongoose.model('Student').countDocuments({
    agentId: this._id
  });
  
  if (studentCount > 0) {
    throw new Error('Cannot delete agent with existing students');
  }
  
  // Delete associated user
  await mongoose.model('User').findByIdAndDelete(this.userId);
  next();
});

// Instance method
agentSchema.methods.calculateTotalCommissions = async function() {
  const result = await mongoose.model('Commission').aggregate([
    { $match: { agentId: this._id } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result[0]?.total || 0;
};

// Static method
agentSchema.statics.findActiveAgents = function() {
  return this.find({ status: 'active' });
};
```

#### Student.js
```javascript
const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    dateOfBirth: Date,
    gender: String,
    nationality: String,
    currentAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    permanentAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    }
  },
  academicInfo: {
    institutionsAttended: [{
      name: String,
      degree: String,
      fieldOfStudy: String,
      startDate: Date,
      endDate: Date,
      grade: String
    }],
    gradeAverage: {
      type: String,
      value: Number
    },
    standardizedTests: {
      gre: { score: Number, date: Date },
      gmat: { score: Number, date: Date },
      sat: { score: Number, date: Date },
      toefl: { score: Number, date: Date },
      ielts: { score: Number, date: Date },
      pte: { score: Number, date: Date }
    }
  },
  documents: [{
    name: String,
    type: String,
    filename: String,
    path: String,
    uploadedAt: Date
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Virtual: applications
studentSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'studentId'
});

// Index for search optimization
studentSchema.index({ 
  'personalInfo.firstName': 'text',
  'personalInfo.lastName': 'text',
  'personalInfo.email': 'text',
  studentId: 'text'
});
```

---

## Services Layer

### emailService.js
```javascript
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  async sendEmail({ to, subject, html }) {
    try {
      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to,
        subject,
        html
      });
    } catch (error) {
      console.error('Email send error:', error);
      throw new Error('Failed to send email');
    }
  }
  
  async sendAgentWelcomeEmail(to, data) {
    const html = `
      <h1>Welcome to Agent CRM</h1>
      <p>Hello ${data.name},</p>
      <p>Your agent account has been created.</p>
      <p><strong>Agent ID:</strong> ${data.agentId}</p>
      <p><strong>Temporary Password:</strong> ${data.tempPassword}</p>
      <p>Please login and change your password: ${data.loginUrl}</p>
    `;
    
    await this.sendEmail({
      to,
      subject: 'Welcome to Agent CRM',
      html
    });
  }
  
  async sendPasswordResetEmail(to, resetUrl) {
    const html = `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `;
    
    await this.sendEmail({
      to,
      subject: 'Password Reset',
      html
    });
  }
  
  async sendCommissionApprovalEmail(agent) {
    // Implementation
  }
}

module.exports = new EmailService();
```

### commissionService.js
```javascript
class CommissionService {
  async calculateCommission(application) {
    // Get commission rule
    const rule = await CommissionRule.findOne({
      universityId: application.universityId,
      courseId: application.courseId
    });
    
    if (!rule) {
      throw new Error('Commission rule not found');
    }
    
    // Calculate amount
    const amount = application.tuitionFee * (rule.rate / 100);
    
    return {
      rate: rule.rate,
      amount,
      ruleId: rule._id
    };
  }
  
  async createCommissionRecord(applicationId, agentId, amount) {
    return await Commission.create({
      applicationId,
      agentId,
      amount,
      status: 'pending',
      calculatedDate: new Date()
    });
  }
  
  async approveCommissions(commissionIds) {
    return await Commission.updateMany(
      { _id: { $in: commissionIds } },
      { 
        status: 'approved',
        approvedDate: new Date()
      }
    );
  }
  
  async processPayouts(agentId) {
    // Get all approved unpaid commissions
    const commissions = await Commission.find({
      agentId,
      status: 'approved',
      payoutId: null
    });
    
    if (commissions.length === 0) {
      throw new Error('No commissions to process');
    }
    
    // Calculate total
    const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);
    
    // Create payout record
    const payout = await Payout.create({
      agentId,
      amount: totalAmount,
      commissions: commissions.map(c => c._id),
      status: 'processing',
      requestedDate: new Date()
    });
    
    // Update commissions
    await Commission.updateMany(
      { _id: { $in: commissions.map(c => c._id) } },
      { 
        payoutId: payout._id,
        status: 'paid',
        paidDate: new Date()
      }
    );
    
    return payout;
  }
}

module.exports = new CommissionService();
```

---

## Middleware Functions

### authMiddleware.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extract token
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Check if user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or inactive account' 
      });
    }
    
    // 4. Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = authMiddleware;
```

### roleMiddleware.js
```javascript
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};

module.exports = roleMiddleware;
```

### uploadMiddleware.js
```javascript
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, PNG allowed.'), false);
  }
};

// Create upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;
```

---

## Routes Configuration

### Route Organization Pattern

```javascript
// routes/agentRoutes.js
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all agents (Admin only)
router.get('/', 
  roleMiddleware(['SUPER_ADMIN', 'ADMIN']),
  agentController.getAllAgents
);

// Get single agent
router.get('/:id', agentController.getAgentById);

// Create agent (Admin only)
router.post('/', 
  roleMiddleware(['SUPER_ADMIN', 'ADMIN']),
  agentController.createAgent
);

// Update agent
router.put('/:id', agentController.updateAgent);

// Delete agent (Super Admin only)
router.delete('/:id',
  roleMiddleware(['SUPER_ADMIN']),
  agentController.deleteAgent
);

// Update agent status (Admin only)
router.patch('/:id/status',
  roleMiddleware(['SUPER_ADMIN', 'ADMIN']),
  agentController.updateAgentStatus
);

// Get agent's students
router.get('/:id/students', agentController.getAgentStudents);

// Get agent's commissions
router.get('/:id/commissions', agentController.getAgentCommissions);

module.exports = router;
```

---

## Utilities

### generateId.js
```javascript
const Counter = require('../models/Counter');

// Generate sequential agent ID
async function generateAgentId() {
  const counter = await Counter.findOneAndUpdate(
    { name: 'agentId' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  
  return `AGT${String(counter.value).padStart(6, '0')}`;
  // Example: AGT000001, AGT000002, etc.
}

async function generateStudentId() {
  const counter = await Counter.findOneAndUpdate(
    { name: 'studentId' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  
  return `STU${String(counter.value).padStart(6, '0')}`;
}

function generateReferralCode() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

module.exports = {
  generateAgentId,
  generateStudentId,
  generateReferralCode
};
```

### validators.js
```javascript
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePhone = (phone) => {
  const regex = /^\+?[\d\s-()]+$/;
  return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const validatePassword = (password) => {
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /\d/.test(password);
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword
};
```

---

## How Code is Managed

### 1. Adding New Endpoints
```
Checklist:
□ Define route in routes/ file
□ Create controller method in controllers/
□ Add middleware if needed (auth, role, validation)
□ Update model if schema changes required
□ Test endpoint with Postman/Thunder Client
□ Document in API_DOCUMENTATION.md
□ Update frontend service
```

### 2. Database Changes
```
Process:
1. Update Mongoose schema in models/
2. Add indexes if needed for performance
3. Create migration script if modifying existing data
4. Test with sample data
5. Update seed data if needed
6. Document schema changes
```

### 3. Adding Business Logic
```
Location decision:
- Simple logic → Controller
- Complex/reusable logic → Service
- Data validation → Model or Validator
- External integrations → Service
```

### 4. Error Handling Pattern
```javascript
// In controller
try {
  // Business logic
  const result = await service.doSomething();
  res.json({ success: true, data: result });
} catch (error) {
  // Let error middleware handle it
  next(error);
}

// Or throw custom errors
if (!resource) {
  throw new NotFoundError('Resource');
}
```

### 5. Testing Strategy
```
Manual Testing:
1. Test with different roles
2. Test validation errors
3. Test edge cases
4. Check response format
5. Verify database changes

Automated Testing (Future):
- Unit tests for services
- Integration tests for APIs
- E2E tests for critical flows
```

---

*Keep this guide updated as new functionality is added or patterns evolve.*
