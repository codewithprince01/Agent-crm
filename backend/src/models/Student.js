const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Sub-schema for embedded documents
const studentDocumentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true
  },
  documentName: {
    type: String,
    required: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

const studentSchema = new mongoose.Schema({
  // Authentication
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
    // unique constraint removed - handled by compound index with isCompleted
  },
  password: {
    type: String,
    required: false // Not required for drafts or until password is set
  },
  isPasswordSet: {
    type: Boolean,
    default: false
  },

  // Password Setup (First-time)
  passwordSetupToken: String,
  passwordSetupExpires: Date,

  // Password Reset (OTP-based)
  passwordResetOTP: String,
  passwordResetOTPExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerifiedAt: Date,

  // Personal details
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
  phone: String,
  countryCode: String, // Phone country code
  fatherName: String,
  motherName: String,
  dateOfBirth: Date,
  firstLanguage: String,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  nationality: String,
  passportNumber: String,
  passportExpiry: Date,
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced'],
    default: 'Single'
  },

  // Address
  address: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  homeContactNumber: String,

  // Academic & Education
  academicLevel: String,
  educationCountry: String,
  highestLevel: String,
  gradingScheme: String,
  gradeAverage: String,

  // Nested Schools Attended
  schoolsAttended: [{
    country: String,
    institutionName: String,
    educationLevel: String,
    primaryLanguage: String,
    fromMonthYear: String,
    toMonthYear: String,
    degreeName: String,
    graduated: Boolean,
    graduationDate: Date,
    certificateAvailable: Boolean,
    address: String,
    city: String,
    province: String,
    zipCode: String
  }],

  // Test Scores (English Proficiency)
  examType: String,
  examDate: Date,
  listeningScore: String,
  readingScore: String,
  writingScore: String,
  speakingScore: String,
  overallScore: String,

  // Additional Qualifications (Detailed)
  additionalQualifications: {
    gre: {
      hasExam: { type: Boolean, default: false },
      examDate: Date,
      verbalScore: String,
      verbalRank: String,
      quantScore: String,
      quantRank: String,
      writingScore: String,
      writingRank: String
    },
    gmat: {
      hasExam: { type: Boolean, default: false },
      examDate: Date,
      verbalScore: String,
      verbalRank: String,
      quantScore: String,
      quantRank: String,
      writingScore: String,
      writingRank: String,
      irScore: String,
      irRank: String,
      totalScore: String,
      totalRank: String
    },
    sat: {
      hasExam: { type: Boolean, default: false },
      examDate: Date,
      reasoningPoint: String,
      subjectTestPoint: String
    }
  },

  // Background
  visaRefusal: String,
  studyPermit: String,
  backgroundDetails: String,

  // Agent reference
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },

  // Referral tracking - who referred this student
  referredBy: {
    type: String, // Can be user ID, agent ID, or admin ID
    default: null
  },

  // Draft/Resume tracking
  tempStudentId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values without uniqueness constraint
    index: true
  },
  currentStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  isDraft: {
    type: Boolean,
    default: true,
    index: true
  },
  lastSavedStep: {
    type: Number,
    default: 0,
    min: 0,
    max: 4
  },

  // Embedded documents array
  documents: [studentDocumentSchema],

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Compound index for email uniqueness (only for completed students)
studentSchema.index({ email: 1, isCompleted: 1 }, { unique: true });

// Other indexes
studentSchema.index({ agentId: 1, status: 1 });
studentSchema.index({ passportNumber: 1 });
studentSchema.index({ isDraft: 1, createdAt: 1 }); // For cleanup jobs
studentSchema.index({ tempStudentId: 1 }, { unique: true, sparse: true });

// Hash password before saving
studentSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
studentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hide password in JSON responses
studentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Student', studentSchema);
