const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const agentSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },

  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  alternatePhone: String,
  designation: String,
  experience: String,
  qualification: String,

  // Company Information
  companyName: {
    type: String,
    required: true
  },
  companyType: {
    type: String,
    required: true
  },
  registrationNumber: String,
  establishedYear: {
    type: Number,
    required: true
  },
  website: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  country: {
    type: String,
    default: 'India'
  },

  // Specialization & Services
  specialization: [{
    type: String
  }],
  servicesOffered: [{
    type: String
  }],

  // Business Metrics
  currentStudents: String,
  teamSize: String,
  annualRevenue: String,

  // Partnership Details
  partnershipType: String,
  expectedStudents: String,
  marketingBudget: String,
  whyPartner: String,
  references: String,
  additionalInfo: String,

  // Consent & Terms
  termsAccepted: {
    type: Boolean,
    default: false
  },
  dataConsent: {
    type: Boolean,
    default: false
  },
  termsAcceptedAt: Date,
  dataConsentAt: Date,

  // Document Storage Paths
  documents: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },



  // Status fields
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  approvalReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  declinedAt: Date,
  lastLogin: Date,

  // Tracking Fields
  ipAddress: String,
  browser: String,
  os: String,

  // Password Management
  isPasswordSet: {
    type: Boolean,
    default: false
  },
  passwordSetupToken: String,
  passwordSetupExpires: Date,
  passwordResetOTP: String,
  passwordResetOTPExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,



  // Access Control for external API data
  accessibleCountries: [{
    type: String,
    trim: true
  }],
  accessibleUniversities: [{
    type: String,
    trim: true
  }],

  // Stats (denormalized)
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalApplications: { type: Number, default: 0 },
    totalCommissions: { type: Number, default: 0 },
    lifetimeEarnings: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { flattenMaps: true, virtuals: true, getters: true },
  toObject: { flattenMaps: true, virtuals: true, getters: true }
});

// Indexes (email is already indexed via unique: true)
agentSchema.index({ approvalStatus: 1, status: 1 });
agentSchema.index({ country: 1, city: 1 });

// Hash password before saving
agentSchema.pre('save', async function () {
  // Handle password
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    // Set consent timestamps
    if (this.isModified('termsAccepted') && this.termsAccepted && !this.termsAcceptedAt) {
      this.termsAcceptedAt = new Date();
    }
    if (this.isModified('dataConsent') && this.dataConsent && !this.dataConsentAt) {
      this.dataConsentAt = new Date();
    }
  } catch (error) {
    throw error;
  }
});

// Compare password method
agentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};



// Hide password in JSON responses
agentSchema.methods.toJSON = function () {
  const obj = this.toObject({ flattenMaps: true });
  delete obj.password;
  return obj;
};

// Virtual for full name
agentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Agent', agentSchema);
