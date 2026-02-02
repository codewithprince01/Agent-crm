const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Commission = sequelize.define('Commission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'applications', key: 'id' },
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'agents', key: 'id' },
  },
  commission_rule_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'commission_rules', key: 'id' },
  },
  base_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Tuition fee or base amount',
  },
  commission_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  commission_type: {
    type: DataTypes.ENUM('percentage', 'flat'),
    allowNull: false,
  },
  commission_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'paid'),
    defaultValue: 'pending',
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'commissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Commission;
