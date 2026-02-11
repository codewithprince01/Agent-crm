const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: String, // Denormalized
  userRole: String, // ADMIN, AGENT, etc.

  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  agentName: String, // Denormalized for agent actions

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  studentName: String, // Denormalized for student actions

  action: {
    type: String,
    required: true
  },
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,

  oldValues: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  newValues: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  ipAddress: String,
  userAgent: String,
  description: String
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ agentId: 1, createdAt: -1 });
auditLogSchema.index({ studentId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
