# Backend Architecture Documentation

**Project:** Agent CRM - Backend API  
**Created:** 2026-02-12  
**Last Updated:** 2026-02-12

---

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture Patterns](#architecture-patterns)
5. [Database Schema](#database-schema)
6. [API Design](#api-design)
7. [Authentication & Authorization](#authentication--authorization)
8. [Business Logic Layer](#business-logic-layer)
9. [Data Flow](#data-flow)
10. [Error Handling](#error-handling)
11. [Code Organization](#code-organization)

---

## Overview

The Agent CRM backend is a RESTful API built with Node.js and Express, providing comprehensive functionality for managing educational agents, students, applications, and administrative operations. The system implements role-based access control and follows clean architecture principles.

### Key Features
- **User Management**: Multi-role system (Super Admin, Admin, Agent)
- **Student Management**: Comprehensive student profiles and academic tracking
- **Application Processing**: Student application workflow management
- **Commission System**: Automated commission calculation and payout tracking
- **Audit Logging**: Complete activity tracking for compliance
- **Email Services**: Automated notifications and verification
- **File Upload**: Document management for students and applications
- **Analytics**: Real-time dashboard statistics

---

## Technology Stack

```
Runtime:          Node.js
Framework:        Express.js
Database:         MongoDB with Mongoose ODM
Authentication:   JWT (JSON Web Tokens)
Email:            Nodemailer
File Upload:      Multer
Validation:       express-validator / Custom validators
Security:         bcrypt, helmet, cors
Environment:      dotenv
Logging:          Morgan / Custom logging
```

---

## Project Structure

```
backend/
├── src/
│   ├── controllers/              # Request handlers
│   │   ├── authController.js     # Authentication logic
│   │   ├── agentController.js    # Agent management
│   │   ├── studentController.js  # Student management
│   │   ├── applicationController.js
│   │   ├── commissionController.js
│   │   ├── dashboardController.js
│   │   ├── inquiryController.js
│   │   ├── otpController.js
│   │   ├── payoutController.js
│   │   ├── settingsController.js
│   │   ├── courseController.js
│   │   ├── universityController.js
│   │   ├── auditLogController.js
│   │   ├── externalApiController.js
│   │   ├── studentDraftController.js
│   │   └── userController.js
│   │
│   ├── models/                   # Mongoose schemas
│   │   ├── Agent.js              # Agent schema
│   │   ├── Student.js            # Student schema
│   │   ├── Application.js        # Application schema
│   │   ├── User.js               # User schema
│   │   ├── Commission.js         # Commission schema
│   │   ├── CommissionRule.js     # Commission rules
│   │   ├── Payout.js             # Payout records
│   │   ├── Course.js             # Course catalog
│   │   ├── University.js         # University data
│   │   ├── AuditLog.js           # Activity logs
│   │   ├── EmailVerification.js  # Email verification
│   │   ├── Setting.js            # System settings
│   │   ├── Counter.js            # Auto-increment counters
│   │   └── index.js              # Model exports
│   │
│   ├── routes/                   # API route definitions
│   │   ├── authRoutes.js
│   │   ├── agentRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── commissionRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── inquiryRoutes.js
│   │   ├── otpRoutes.js
│   │   ├── payoutRoutes.js
│   │   ├── settingsRoutes.js
│   │   ├── courseRoutes.js
│   │   ├── universityRoutes.js
│   │   ├── auditLogRoutes.js
│   │   ├── externalApiRoutes.js
│   │   ├── studentDraftRoutes.js
│   │   ├── userRoutes.js
│   │   └── index.js
│   │
│   ├── middlewares/              # Custom middleware
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── roleMiddleware.js     # Role-based access control
│   │   ├── uploadMiddleware.js   # File upload handling
│   │   └── errorMiddleware.js    # Error handler
│   │
│   ├── services/                 # Business logic services
│   │   ├── emailService.js       # Email operations
│   │   ├── commissionService.js  # Commission calculations
│   │   ├── auditService.js       # Audit logging
│   │   └── fileService.js        # File handling
│   │
│   ├── utils/                    # Utility functions
│   │   ├── validators.js         # Data validation
│   │   ├── helpers.js            # Helper functions
│   │   ├── constants.js          # Constants
│   │   ├── generateId.js         # ID generation
│   │   ├── parseAddress.js       # Address parsing
│   │   ├── logger.js             # Logging utility
│   │   └── ...
│   │
│   ├── config/                   # Configuration files
│   │   └── database.js           # DB connection config
│   │
│   └── scripts/                  # Utility scripts
│       ├── seedData.js           # Database seeding
│       └── migration.js          # Data migration
│
├── database/                     # Database scripts
│   ├── seeds/                    # Seed data
│   └── migrations/               # Migration scripts
│
├── uploads/                      # Uploaded files
├── logs/                         # Application logs
├── server.js                     # Application entry point
└── history/                      # Architecture & history docs
```

---

## Architecture Patterns

### 1. **MVC Architecture (Model-View-Controller)**

The backend follows a modified MVC pattern:

```
┌──────────────┐
│    Routes    │ ──> Define API endpoints
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Middleware   │ ──> Auth, validation, logging
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controllers  │ ──> Handle requests, orchestrate services
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Services    │ ──> Business logic, external APIs
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Models     │ ──> Data access, database operations
└──────────────┘
```

### 2. **Layered Architecture**

```
┌─────────────────────────────────────┐
│      Presentation Layer (Routes)    │  - HTTP endpoints
├─────────────────────────────────────┤
│    Application Layer (Controllers)  │  - Request handling
├─────────────────────────────────────┤
│     Business Layer (Services)       │  - Business logic
├─────────────────────────────────────┤
│      Data Layer (Models)            │  - Database access
├─────────────────────────────────────┤
│         Database (MongoDB)          │  - Data persistence
└─────────────────────────────────────┘
```

### 3. **Middleware Pipeline**

```
Request → CORS → Body Parser → Logger → Auth → Role Check → Controller → Response
                                              ↓
                                         Error Handler
```

---

## Database Schema

### Core Entities

#### 1. **User Schema**
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  role: String (enum: ['SUPER_ADMIN', 'ADMIN', 'AGENT']),
  status: String (enum: ['active', 'inactive']),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Agent Schema**
```javascript
{
  agentId: String (auto-generated, unique),
  userId: ObjectId (ref: 'User'),
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    dateOfBirth: Date
  },
  businessInfo: {
    companyName: String,
    businessAddress: Object,
    taxId: String,
    licenseNumber: String
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String
  },
  referralInfo: {
    referredBy: ObjectId (ref: 'Agent'),
    referralCode: String (unique)
  },
  status: String (enum: ['active', 'inactive', 'suspended']),
  verificationStatus: String,
  documents: [Object],
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **Student Schema**
```javascript
{
  studentId: String (auto-generated, unique),
  agentId: ObjectId (ref: 'Agent'),
  personalInfo: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    dateOfBirth: Date,
    gender: String,
    nationality: String,
    currentAddress: Object,
    permanentAddress: Object
  },
  academicInfo: {
    institutionsAttended: [Object],
    gradeAverage: Object,
    standardizedTests: {
      gre: Object,
      gmat: Object,
      sat: Object,
      toefl: Object,
      ielts: Object,
      pte: Object
    }
  },
  backgroundInfo: {
    hasRefusal: Boolean,
    hasGap: Boolean,
    gapDetails: String,
    hasCriminalRecord: Boolean
  },
  passportInfo: {
    passportNumber: String,
    issueDate: Date,
    expiryDate: Date,
    countryOfIssue: String
  },
  documents: [Object],
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **Application Schema**
```javascript
{
  applicationId: String (auto-generated),
  studentId: ObjectId (ref: 'Student'),
  agentId: ObjectId (ref: 'Agent'),
  universityId: ObjectId (ref: 'University'),
  courseId: ObjectId (ref: 'Course'),
  status: String (enum: ['draft', 'submitted', 'under_review', ...]),
  documents: [Object],
  timeline: [Object],
  tuitionFee: Number,
  commissionRate: Number,
  commissionAmount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **Commission Schema**
```javascript
{
  agentId: ObjectId (ref: 'Agent'),
  applicationId: ObjectId (ref: 'Application'),
  amount: Number,
  status: String (enum: ['pending', 'approved', 'paid']),
  calculatedDate: Date,
  paidDate: Date,
  payoutId: ObjectId (ref: 'Payout')
}
```

#### 6. **AuditLog Schema**
```javascript
{
  userId: ObjectId (ref: 'User'),
  action: String,
  resource: String,
  resourceId: String,
  changes: Object,
  ipAddress: String,
  userAgent: String,
  timestamp: Date
}
```

### Database Relationships

```
User ──1:1──> Agent
Agent ──1:N──> Student
Student ──1:N──> Application
Application ──N:1──> University
Application ──N:1──> Course
Application ──1:1──> Commission
Commission ──N:1──> Payout
Agent ──1:N──> Agent (referral tree)
```

---

## API Design

### RESTful Principles

```
Resource-based URLs
HTTP Methods: GET, POST, PUT, PATCH, DELETE
Consistent response format
Proper status codes
Versioning (future: /api/v1/)
```

### API Endpoints Structure

#### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
POST   /api/auth/forgot-password   - Request password reset
POST   /api/auth/reset-password    - Reset password
GET    /api/auth/verify-email      - Verify email
POST   /api/auth/refresh-token     - Refresh JWT token
```

#### Agents
```
GET    /api/agents                 - Get all agents
GET    /api/agents/:id             - Get agent by ID
POST   /api/agents                 - Create new agent
PUT    /api/agents/:id             - Update agent
DELETE /api/agents/:id             - Delete agent
GET    /api/agents/:id/students    - Get agent's students
GET    /api/agents/:id/commissions - Get agent's commissions
PATCH  /api/agents/:id/status      - Update agent status
```

#### Students
```
GET    /api/students               - Get all students
GET    /api/students/:id           - Get student by ID
POST   /api/students               - Create new student
PUT    /api/students/:id           - Update student
DELETE /api/students/:id           - Delete student
POST   /api/students/:id/documents - Upload document
GET    /api/students/:id/applications - Get student applications
```

#### Applications
```
GET    /api/applications           - Get all applications
GET    /api/applications/:id       - Get application by ID
POST   /api/applications           - Create application
PUT    /api/applications/:id       - Update application
PATCH  /api/applications/:id/status - Update status
POST   /api/applications/:id/documents - Upload documents
```

#### Dashboard
```
GET    /api/dashboard/stats        - Get dashboard statistics
GET    /api/dashboard/recent-activity - Get recent activities
GET    /api/dashboard/analytics    - Get analytics data
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  }
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Authentication & Authorization

### JWT Authentication Flow

```
┌──────────────┐
│  Login API   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Validate Credentials │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Generate JWT Token  │
│  - Payload: user ID, │
│    role, email       │
│  - Expiry: 24h       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Return Token to      │
│ Client               │
└──────────────────────┘

Subsequent Requests:
┌──────────────────────┐
│ Request with Token   │
│ Header: Authorization│
│ Bearer <token>       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Verify Token         │
│ (authMiddleware)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Check Role           │
│ (roleMiddleware)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Process Request      │
└──────────────────────┘
```

### Middleware Implementation

```javascript
// authMiddleware.js
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// roleMiddleware.js
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }
    next();
  };
};
```

### Role-Based Access Control Matrix

```
┌─────────────────────┬───────────┬───────┬───────┐
│ Resource/Action     │ SuperAdmin│ Admin │ Agent │
├─────────────────────┼───────────┼───────┼───────┤
│ Manage Admins       │     ✓     │   ✗   │   ✗   │
│ Manage Agents       │     ✓     │   ✓   │   ✗   │
│ View All Students   │     ✓     │   ✓   │   ✗   │
│ Manage Own Students │     ✓     │   ✓   │   ✓   │
│ View All Commissions│     ✓     │   ✓   │   ✗   │
│ View Own Commissions│     ✓     │   ✓   │   ✓   │
│ System Settings     │     ✓     │   ✗   │   ✗   │
│ View Analytics      │     ✓     │   ✓   │   ✓   │
└─────────────────────┴───────────┴───────┴───────┘
```

---

## Business Logic Layer

### Service Pattern

Business logic is extracted into service modules:

```javascript
// services/commissionService.js
class CommissionService {
  async calculateCommission(application) {
    // Fetch commission rule
    const rule = await CommissionRule.findOne({ 
      universityId: application.universityId 
    });
    
    // Calculate amount
    const amount = application.tuitionFee * (rule.rate / 100);
    
    // Create commission record
    const commission = await Commission.create({
      agentId: application.agentId,
      applicationId: application._id,
      amount,
      status: 'pending'
    });
    
    // Send notification
    await emailService.sendCommissionNotification(commission);
    
    return commission;
  }
  
  async processPayouts(agentId) {
    // Get approved commissions
    const commissions = await Commission.find({
      agentId,
      status: 'approved',
      payoutId: null
    });
    
    // Calculate total
    const total = commissions.reduce((sum, c) => sum + c.amount, 0);
    
    // Create payout
    const payout = await Payout.create({
      agentId,
      amount: total,
      commissions: commissions.map(c => c._id),
      status: 'processing'
    });
    
    // Update commissions
    await Commission.updateMany(
      { _id: { $in: commissions.map(c => c._id) } },
      { payoutId: payout._id, status: 'paid' }
    );
    
    return payout;
  }
}

module.exports = new CommissionService();
```

---

## Data Flow

### Request-Response Flow

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────┐
│  Express Router     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  CORS Middleware    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Body Parser        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Auth Middleware    │
│  (Verify JWT)       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Role Middleware    │
│  (Check Permission) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Controller        │
│  (Orchestrate)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│    Service          │
│  (Business Logic)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│     Model           │
│  (Database Query)   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│    MongoDB          │
└──────┬──────────────┘
       │ Result
       ▼
┌─────────────────────┐
│  Format Response    │
└──────┬──────────────┘
       │ JSON Response
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

### Database Transaction Flow (Example: Create Application)

```javascript
async createApplication(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Validate student exists
    const student = await Student.findById(req.body.studentId).session(session);
    if (!student) throw new Error('Student not found');
    
    // 2. Create application
    const application = await Application.create([req.body], { session });
    
    // 3. Calculate commission
    const commission = await commissionService.calculateCommission(
      application[0], 
      session
    );
    
    // 4. Log activity
    await auditService.log({
      userId: req.user.id,
      action: 'CREATE_APPLICATION',
      resourceId: application[0]._id
    }, session);
    
    // 5. Commit transaction
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

---

## Error Handling

### Error Middleware

```javascript
// middlewares/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: Object.values(err.errors).map(e => e.message)
      }
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: 'Resource already exists'
      }
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }
    });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong'
    }
  });
};
```

### Custom Error Classes

```javascript
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
```

---

## Code Organization

### Controller Pattern

```javascript
// controllers/agentController.js
exports.getAllAgents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { 'personalInfo.firstName': new RegExp(search, 'i') },
      { 'personalInfo.email': new RegExp(search, 'i') }
    ];
    
    // Execute query with pagination
    const agents = await Agent.find(query)
      .populate('userId', 'email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
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
  } catch (error) {
    next(error);
  }
};
```

### Model Pattern

```javascript
// models/Agent.js
const mongoose = require('mongoose');
const { generateAgentId } = require('../utils/generateId');

const agentSchema = new mongoose.Schema({
  agentId: {
    type: String,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Pre-save hook: Generate agent ID
agentSchema.pre('save', async function(next) {
  if (!this.agentId) {
    this.agentId = await generateAgentId();
  }
  next();
});

// Instance method
agentSchema.methods.getStudentCount = async function() {
  const Student = mongoose.model('Student');
  return await Student.countDocuments({ agentId: this._id });
};

// Static method
agentSchema.statics.findByEmail = function(email) {
  return this.findOne({ 'personalInfo.email': email });
};

module.exports = mongoose.model('Agent', agentSchema);
```

---

## Best Practices

### 1. Security
- ✓ Hash passwords with bcrypt
- ✓ Use JWT for stateless authentication
- ✓ Implement rate limiting
- ✓ Sanitize user input
- ✓ Use HTTPS in production
- ✓ Enable CORS with whitelist
- ✓ Implement helmet for security headers

### 2. Performance
- ✓ Index frequently queried fields
- ✓ Use pagination for large datasets
- ✓ Implement caching (Redis - future)
- ✓ Optimize database queries
- ✓ Use connection pooling
- ✓ Compress responses (gzip)

### 3. Code Quality
- ✓ Follow consistent naming conventions
- ✓ Write modular, reusable code
- ✓ Implement proper error handling
- ✓ Add comprehensive logging
- ✓ Write meaningful comments
- ✓ Use environment variables

### 4. Database
- ✓ Use transactions for critical operations
- ✓ Implement soft deletes where needed
- ✓ Validate data at schema level
- ✓ Use populate wisely (avoid N+1 queries)
- ✓ Regular backups

### 5. API Design
- ✓ RESTful conventions
- ✓ Consistent response format
- ✓ Proper HTTP status codes
- ✓ Versioning strategy
- ✓ Comprehensive documentation

---

## Future Enhancements

- [ ] TypeScript migration
- [ ] GraphQL API option
- [ ] Redis caching layer
- [ ] WebSocket for real-time updates
- [ ] Advanced analytics and reporting
- [ ] Microservices architecture
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Comprehensive test coverage
- [ ] API rate limiting per user
- [ ] Advanced search with Elasticsearch

---

*This document should be updated whenever significant architectural changes are made.*
