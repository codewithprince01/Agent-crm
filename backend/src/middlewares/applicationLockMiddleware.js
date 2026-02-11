const { Application } = require('../models');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Middleware to check if an application is locked for agents
 */
const applicationLockMiddleware = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Admins and Super Admins bypass locking
        if (['ADMIN', 'SUPER_ADMIN'].includes(req.userRole)) {
            return next();
        }

        const application = await Application.findById(id);

        if (!application) {
            return ResponseHandler.notFound(res, 'Application not found');
        }

        // Check if locked and user is Agent
        if (application.lockedForAgent && req.userRole === 'AGENT') {
            return ResponseHandler.forbidden(res, 'This application is locked and cannot be modified by an agent');
        }

        next();
    } catch (error) {
        return ResponseHandler.serverError(res, 'Lock middleware error', error);
    }
};

module.exports = applicationLockMiddleware;
