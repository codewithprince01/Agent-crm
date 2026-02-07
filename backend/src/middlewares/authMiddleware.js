const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;

    // Find user in the appropriate table based on role in token
    if (decoded.role === 'STUDENT') {
      const { Student } = require('../models');
      user = await Student.findById(decoded.id).select('-password');
    } else if (decoded.role === 'AGENT') {
      const { Agent } = require('../models');
      user = await Agent.findById(decoded.id).select('-password');
    } else if (decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN') {
      user = await User.findById(decoded.id).select('-password');
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid user role',
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = decoded.role; // Use role from token

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
