const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  application_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'students', key: 'id' },
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'agents', key: 'id' },
  },
  university_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'universities', key: 'id' },
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'courses', key: 'id' },
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'offer_issued', 'offer_accepted', 'fee_paid', 'en rolled', 'rejected'),
    defaultValue: 'draft',
  },
  intake_date: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  enrolled_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'applications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Application;
