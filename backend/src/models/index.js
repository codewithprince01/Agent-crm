const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Agent = require('./Agent');
const AgentBankDetail = require('./AgentBankDetail');
const University = require('./University');
const Course = require('./Course');
const Student = require('./Student');
const StudentDocument = require('./StudentDocument');
const Application = require('./Application');
const ApplicationStatusHistory = require('./ApplicationStatusHistory');
const CommissionRule = require('./CommissionRule');
const Commission = require('./Commission');
const Payout = require('./Payout');
const AuditLog = require('./AuditLog');

// Define associations

// User associations
User.hasOne(Agent, { foreignKey: 'user_id', as: 'agent' });
User.hasOne(Student, { foreignKey: 'user_id', as: 'student' });

// Agent associations
Agent.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Agent.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
Agent.hasOne(AgentBankDetail, { foreignKey: 'agent_id', as: 'bankDetails' });
Agent.hasMany(Student, { foreignKey: 'agent_id', as: 'students' });
Agent.hasMany(Application, { foreignKey: 'agent_id', as: 'applications' });
Agent.hasMany(CommissionRule, { foreignKey: 'agent_id', as: 'commissionRules' });
Agent.hasMany(Commission, { foreignKey: 'agent_id', as: 'commissions' });
Agent.hasMany(Payout, { foreignKey: 'agent_id', as: 'payouts' });

// AgentBankDetail associations
AgentBankDetail.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });
AgentBankDetail.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });

// University associations
University.hasMany(Course, { foreignKey: 'university_id', as: 'courses' });
University.hasMany(Application, { foreignKey: 'university_id', as: 'applications' });
University.hasMany(CommissionRule, { foreignKey: 'university_id', as: 'commissionRules' });

// Course associations
Course.belongsTo(University, { foreignKey: 'university_id', as: 'university' });
Course.hasMany(Application, { foreignKey: 'course_id', as: 'applications' });
Course.hasMany(CommissionRule, { foreignKey: 'course_id', as: 'commissionRules' });

// Student associations
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Student.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });
Student.hasMany(StudentDocument, { foreignKey: 'student_id', as: 'documents' });
Student.hasMany(Application, { foreignKey: 'student_id', as: 'applications' });

// StudentDocument associations
StudentDocument.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
StudentDocument.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });

// Application associations
Application.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Application.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });
Application.belongsTo(University, { foreignKey: 'university_id', as: 'university' });
Application.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Application.hasMany(ApplicationStatusHistory, { foreignKey: 'application_id', as: 'statusHistory' });
Application.hasOne(Commission, { foreignKey: 'application_id', as: 'commission' });

// ApplicationStatusHistory associations
ApplicationStatusHistory.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });
ApplicationStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });

// CommissionRule associations
CommissionRule.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });
CommissionRule.belongsTo(University, { foreignKey: 'university_id', as: 'university' });
CommissionRule.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Commission associations
Commission.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });
Commission.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });
Commission.belongsTo(CommissionRule, { foreignKey: 'commission_rule_id', as: 'rule' });
Commission.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Payout associations
Payout.belongsTo(Agent, { foreignKey: 'agent_id', as: 'agent' });
Payout.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });

// AuditLog associations
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Export all models
module.exports = {
  sequelize,
  User,
  Agent,
  AgentBankDetail,
  University,
  Course,
  Student,
  StudentDocument,
  Application,
  ApplicationStatusHistory,
  CommissionRule,
  Commission,
  Payout,
  AuditLog,
};
