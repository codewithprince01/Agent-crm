const { AgentUniversityAssignment, Agent, UniversityProgram } = require('../models');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

class AgentUniversityController {
    /**
     * Bulk assign universities to agents
     * POST /api/agent-university/bulk-assign
     * Payload: { universityIds: [], agentIds: [] }
     */
    static async bulkAssign(req, res) {
        try {
            const { universityIds, agentIds } = req.body;

            if (!universityIds || !Array.isArray(universityIds) || universityIds.length === 0) {
                return ResponseHandler.badRequest(res, 'University IDs are required');
            }

            if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
                return ResponseHandler.badRequest(res, 'Agent IDs are required');
            }

            const assignments = [];
            const assignedBy = req.userId; // From auth middleware

            for (const universityId of universityIds) {
                for (const agentId of agentIds) {
                    assignments.push({
                        universityId,
                        agentId,
                        assignedBy
                    });
                }
            }

            // Using bulkWrite with upsert to avoid duplicate keys error and skip existing
            const bulkOps = assignments.map(assignment => ({
                updateOne: {
                    filter: { agentId: assignment.agentId, universityId: assignment.universityId },
                    update: { $setOnInsert: assignment },
                    upsert: true
                }
            }));

            await AgentUniversityAssignment.bulkWrite(bulkOps);

            return ResponseHandler.success(res, 'Bulk assignment completed successfully');
        } catch (error) {
            logger.error('Bulk assign error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to perform bulk assignment', error);
        }
    }

    /**
     * Get agents assigned to a specific university
     * GET /api/agent-university/university/:universityId/agents
     */
    static async getAssignedAgentsByUniversity(req, res) {
        try {
            const { universityId } = req.params;
            const assignments = await AgentUniversityAssignment.find({ universityId })
                .populate('agentId', 'firstName lastName email companyName status');

            return ResponseHandler.success(res, 'Assigned agents retrieved successfully', assignments);
        } catch (error) {
            logger.error('Get assigned agents error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to get assigned agents', error);
        }
    }

    /**
     * Get summary of assignment counts for multiple universities
     * GET /api/agent-university/stats/assignment-counts
     */
    static async getAssignmentCounts(req, res) {
        try {
            const stats = await AgentUniversityAssignment.aggregate([
                {
                    $group: {
                        _id: '$universityId',
                        count: { $sum: 1 },
                        agents: { $push: '$agentId' }
                    }
                }
            ]);

            return ResponseHandler.success(res, 'Assignment counts retrieved successfully', stats);
        } catch (error) {
            logger.error('Get assignment counts error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to get assignment counts', error);
        }
    }

    /**
     * Sync agents for a specific university (Add new, remove missing)
     * POST /api/agent-university/university/:universityId/sync-agents
     * Payload: { agentIds: [] }
     */
    static async syncUniversityAgents(req, res) {
        try {
            const { universityId } = req.params;
            const { agentIds } = req.body;
            const assignedBy = req.userId;

            if (!universityId) {
                return ResponseHandler.badRequest(res, 'University ID is required');
            }

            if (!agentIds || !Array.isArray(agentIds)) {
                return ResponseHandler.badRequest(res, 'Agent IDs must be an array');
            }

            // Get current assignments
            const existingAssignments = await AgentUniversityAssignment.find({ universityId });
            const existingAgentIds = existingAssignments.map(a => a.agentId.toString());

            // Agents to remove: Exist but not in the new list
            const agentsToRemove = existingAgentIds.filter(id => !agentIds.includes(id));

            // Agents to add: In the new list but don't exist
            const agentsToAdd = agentIds.filter(id => !existingAgentIds.includes(id));

            // Perform deletions
            if (agentsToRemove.length > 0) {
                await AgentUniversityAssignment.deleteMany({
                    universityId,
                    agentId: { $in: agentsToRemove }
                });
            }

            // Perform additions
            if (agentsToAdd.length > 0) {
                const newAssignments = agentsToAdd.map(agentId => ({
                    universityId,
                    agentId,
                    assignedBy
                }));
                await AgentUniversityAssignment.insertMany(newAssignments);
            }

            logger.info('University agents synced', {
                universityId,
                added: agentsToAdd.length,
                removed: agentsToRemove.length
            });

            return ResponseHandler.success(res, 'Agents synced successfully', {
                added: agentsToAdd.length,
                removed: agentsToRemove.length
            });
        } catch (error) {
            logger.error('Sync university agents error', { error: error.message });
            return ResponseHandler.serverError(res, 'Failed to sync agents', error);
        }
    }
}

module.exports = AgentUniversityController;
