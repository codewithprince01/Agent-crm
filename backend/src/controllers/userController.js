const { User } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const AuditService = require('../services/auditService');
const logger = require('../utils/logger');

class UserController {
    /**
     * Get all users
     * GET /api/users
     */
    static async getUsers(req, res) {
        try {
            const { role, status, search, page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            const query = {};

            // Filter by role
            if (role) {
                query.role = role;
            }

            // Filter by status
            if (status) {
                query.status = status;
            }

            // Search by name or email
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }

            const users = await User.find(query)
                .select('-password')
                .limit(parseInt(limit))
                .skip(skip)
                .sort({ createdAt: -1 });

            const count = await User.countDocuments(query);

            return ResponseHandler.paginated(res, 'Users retrieved successfully', users, {
                page: parseInt(page),
                limit: parseInt(limit),
                totalItems: count,
            });
        } catch (error) {
            logger.error('Get users error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to retrieve users', error);
        }
    }

    /**
     * Get user by ID
     * GET /api/users/:id
     */
    static async getUserById(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id).select('-password');

            if (!user) {
                return ResponseHandler.notFound(res, 'User not found');
            }

            return ResponseHandler.success(res, 'User retrieved successfully', { user });
        } catch (error) {
            logger.error('Get user error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to retrieve user', error);
        }
    }

    /**
     * Create new user (Admin)
     * POST /api/users
     */
    static async createUser(req, res) {
        try {
            const { name, email, phone, password, role = 'ADMIN', status = 'active' } = req.body;

            // Check if email exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return ResponseHandler.error(res, 'Email already exists', 400);
            }

            // Create user
            const user = await User.create({
                name,
                email,
                phone,
                password,
                role,
                status,
            });

            logger.info('User created', { userId: user._id, email: user.email, role: user.role });

            // Log audit
            await AuditService.logCreate(req.user, 'User', user._id, {
                name: user.name,
                email: user.email,
                role: user.role
            }, req);

            return ResponseHandler.created(res, 'User created successfully', {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    status: user.status,
                },
            });
        } catch (error) {
            logger.error('Create user error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to create user', error);
        }
    }

    /**
     * Update user
     * PUT /api/users/:id
     */
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, email, phone, password, status } = req.body;

            const user = await User.findById(id);
            if (!user) {
                return ResponseHandler.notFound(res, 'User not found');
            }

            // Check if email is being changed and already exists
            if (email && email !== user.email) {
                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return ResponseHandler.error(res, 'Email already exists', 400);
                }
            }

            // Update fields
            if (name) user.name = name;
            if (email) user.email = email;
            if (phone !== undefined) user.phone = phone;
            if (password) user.password = password;
            if (status) user.status = status;

            await user.save();

            logger.info('User updated', { userId: user._id, email: user.email });

            // Log audit
            await AuditService.logUpdate(req.user, 'User', user._id, {}, { name, email, phone, status }, req);

            return ResponseHandler.success(res, 'User updated successfully', {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone,
                    status: user.status,
                },
            });
        } catch (error) {
            logger.error('Update user error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to update user', error);
        }
    }

    /**
     * Delete user
     * DELETE /api/users/:id
     */
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return ResponseHandler.notFound(res, 'User not found');
            }

            // Prevent deletion of super admin
            if (user.role === 'SUPER_ADMIN') {
                return ResponseHandler.error(res, 'Cannot delete Super Admin user', 403);
            }

            await user.deleteOne();

            // Log audit
            await AuditService.logDelete(req.user, 'User', id, {
                name: user.name,
                email: user.email
            }, req);

            return ResponseHandler.success(res, 'User deleted successfully');
        } catch (error) {
            logger.error('Delete user error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to delete user', error);
        }
    }
}

module.exports = UserController;
