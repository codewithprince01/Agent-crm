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

// No need to define associations in Mongoose
// Relationships are handled via refs and populate()

module.exports = {
  User,
  Agent,
  Student,
  University,
  Course,
  Application,
  CommissionRule,
  Commission,
  Payout,
  AuditLog,
  Setting,
  Counter
};
