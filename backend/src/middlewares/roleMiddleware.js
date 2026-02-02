/**
 * Role-Based Access Control Middleware
 * Restricts access based on user roles
 */

const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Check if user is attached (should be from authMiddleware)
      if (!req.user || !req.userRole) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          requiredRoles: allowedRoles,
          userRole: req.userRole,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message,
      });
    }
  };
};

// Predefined role combinations
const roles = {
  SUPER_ADMIN_ONLY: ['SUPER_ADMIN'],
  ADMIN_ONLY: ['ADMIN'],
  ADMIN_AND_SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN'],
  AGENT_ONLY: ['AGENT'],
  STUDENT_ONLY: ['STUDENT'],
  ALL_ADMINS: ['SUPER_ADMIN', 'ADMIN'],
  ALL:['SUPER_ADMIN', 'ADMIN', 'AGENT', 'STUDENT'],
};

module.exports = { roleMiddleware, roles };
