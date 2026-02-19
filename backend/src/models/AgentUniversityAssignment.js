const mongoose = require('mongoose');

const agentUniversityAssignmentSchema = new mongoose.Schema({
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },
    universityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UniversityProgram',
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Unique compound index to avoid duplicate mappings
agentUniversityAssignmentSchema.index({ agentId: 1, universityId: 1 }, { unique: true });

module.exports = mongoose.model('AgentUniversityAssignment', agentUniversityAssignmentSchema);
