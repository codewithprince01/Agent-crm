const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CommissionRule = sequelize.define('CommissionRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'agents', key: 'id' },
  },
  university_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'universities', key: 'id' },
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'courses', key: 'id' },
  },
  commission_type: {
    type: DataTypes.ENUM('percentage', 'flat'),
    allowNull: false,
  },
  commission_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  priority_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '1=Agent+Course, 2=Agent+University, 3=Course Default, 4=University Default',
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'commission_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CommissionRule;
