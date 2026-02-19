// MongoDB/Mongoose models index
// Replaces Sequelize models and associations

const User = require('./User');
const Agent = require('./Agent');
const Student = require('./Student');
const University = require('./University');
const Course = require('./Course');
const Application = require('./Application');
const CommissionRule = require('./CommissionRule');
const Commission = require('./Commission');
const Payout = require('./Payout');
const AuditLog = require('./AuditLog');
const Setting = require('./Setting');
const Counter = require('./Counter');
const CountryDetail = require('./CountryDetail');
const EmailVerification = require('./EmailVerification');
const Brochure = require('./Brochure');
const BrochureType = require('./BrochureType');
const BrochureCategory = require('./BrochureCategory');
const UniversityProgram = require('./UniversityProgram');
const AgentUniversityAssignment = require('./AgentUniversityAssignment'); // Added based on Code Edit

// Removed: CommissionRule, Commission, Payout based on Code Edit

// No need to define associations in Mongoose
// Relationships are handled via refs and populate()

module.exports = {
  User,
  Agent,
  Student,
  University,
  CountryDetail,
  Course,
  AuditLog,
  Application,
  EmailVerification,
  Setting,
  Counter,
  Brochure,
  BrochureType,
  BrochureCategory,
  UniversityProgram,
  AgentUniversityAssignment,
  Commission,
  CommissionRule,
  Payout
};
