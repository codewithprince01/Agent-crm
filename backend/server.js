const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000' // Add 3000 just in case
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Cookie parser middleware
app.use(cookieParser());

// Rate limiting - Increased for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000, // Increased to 5000 for development
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});


// API Routes (to be added)
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'University CRM API - v1.0.0',
    documentation: '/api/docs',
  });
});

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const agentRoutes = require('./src/routes/agentRoutes');
const applicationRoutes = require('./src/routes/applicationRoutes');
const universityRoutes = require('./src/routes/universityRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const commissionRoutes = require('./src/routes/commissionRoutes');
const payoutRoutes = require('./src/routes/payoutRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const auditLogRoutes = require('./src/routes/auditLogRoutes');
const userRoutes = require('./src/routes/userRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const inquiryRoutes = require('./src/routes/inquiryRoutes');
const studentDraftRoutes = require('./src/routes/studentDraftRoutes');
const otpRoutes = require('./src/routes/otpRoutes');
const agentUniversityRoutes = require('./src/routes/agentUniversityRoutes');
const { validateReferral } = require('./src/middlewares/referralValidation');

// Public referral validation endpoint (no auth required)
app.get('/api/validate-referral', validateReferral, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Referral validated successfully',
    referrer: {
      name: req.referralInfo.name,
      role: req.referralInfo.role
    }
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agent-university', agentUniversityRoutes); // Added agentUniversityRoutes registration
app.use('/api/applications', applicationRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/students/draft', studentDraftRoutes); // Draft/resume routes
app.use('/api/otp', otpRoutes); // OTP verification routes
app.use('/api/commissions', commissionRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/inquiry', inquiryRoutes);
app.use('/api/external-search', require('./src/routes/externalApiRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/countries', require('./src/routes/countryDetailRoutes'));
app.use('/api/brochures', require('./src/routes/brochureRoutes'));

// Serve static files
const path = require('path');
app.use('/upload', express.static(path.join(__dirname, 'upload')));
// New Student Documents Path (Specific match before legacy)
app.use('/uploads/documents/students', express.static(path.join(__dirname, 'uploads/documents/students')));
// Fix for legacy wrong URLs (map /uploads/documents -> upload/student/documents)
app.use('/uploads/documents', express.static(path.join(__dirname, 'upload/student/documents')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/documents', express.static(path.join(__dirname, 'uploads/documents')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 University CRM Backend Server Running       ║
║                                                   ║
║   Environment: ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}                        ║
║   Port: ${PORT}                                      ║
║   API: http://localhost:${PORT}/api                ║
║   Health: http://localhost:${PORT}/health          ║
║   Database: MongoDB                               ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
      `);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
        console.error('\nSolution: Use the server management script');
        console.error('  Run: ./server.sh restart');
        console.error('\nOr manually kill the process:');
        console.error(`  lsof -i :${PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9\n`);
        process.exit(1);
      } else {
        throw err;
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;

