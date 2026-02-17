const express = require('express');
const router = express.Router();
const AgentUniversityController = require('../controllers/agentUniversityController');
const authMiddleware = require('../middlewares/authMiddleware');
const { roleMiddleware, roles } = require('../middlewares/roleMiddleware');

// Bulk assignment - Only Admin/SuperAdmin
router.post('/univerity-broucher-bulk-assign', authMiddleware, roleMiddleware(roles.ALL_ADMINS), AgentUniversityController.bulkAssign);

// Statistics for counts (for listing page)
router.get('/stats/assignment-counts', authMiddleware, roleMiddleware(roles.ALL_ADMINS), AgentUniversityController.getAssignmentCounts);

// Get agents for a specific university
router.get('/university/:universityId/agents', authMiddleware, roleMiddleware(roles.ALL_ADMINS), AgentUniversityController.getAssignedAgentsByUniversity);

// Sync agents for a specific university (Edit Mode)
router.post('/university/:universityId/sync-agents', authMiddleware, roleMiddleware(roles.ALL_ADMINS), AgentUniversityController.syncUniversityAgents);

module.exports = router;
