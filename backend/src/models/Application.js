const mongoose = require('mongoose');

// Sub-schema for status history (embedded)
const statusHistorySchema = new mongoose.Schema({
  oldStatus: String,
  newStatus: {
    type: String,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  changedByName: String, // Denormalized
  notes: String,
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const applicationSchema = new mongoose.Schema({
  // Unique identification
  applicationNo: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // References
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  recruitmentAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    index: true
  },

  // Snapshots
  studentName: {
    type: String,
    required: true
  },

  // Program Details
  programId: {
    type: String, // External ID
    required: true
  },
  programSnapshot: {
    programName: String,
    universityName: String,
    countryName: String,
    level: String,
    duration: String,
    category: String,
    specialization: String
  },

  // Status & Workflow
  stage: {
    type: String,
    enum: [
      'Pre-Payment',
      'Pre-Submission',
      'Submission',
      'Post-Submission',
      'Admission',
      'Visa-Application',
      'Pre-Arrival',
      'Post-Arrival',
      'Arrival'
    ],
    default: 'Pre-Payment'
  },

  // Payment Details
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid', 'cancelled'],
    default: 'unpaid'
  },
  paymentDate: Date,
  applyDate: {
    type: Date,
    default: Date.now
  },

  // Transmission
  isSent: {
    type: Boolean,
    default: false
  },

  // Role-Based Locking
  lockedForAgent: {
    type: Boolean,
    default: false
  },
  submittedByAgent: {
    type: Boolean,
    default: false
  },
  submittedAt: Date,

  // Metadata
  notes: String,
  statusHistory: [statusHistorySchema]
}, {
  timestamps: true
});

// Indexes
applicationSchema.index({ applicationNo: 1 }, { unique: true });
applicationSchema.index({ studentId: 1, programId: 1 }, { unique: true });
applicationSchema.index({ stage: 1 });
applicationSchema.index({ paymentStatus: 1 });
applicationSchema.index({ recruitmentAgentId: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
