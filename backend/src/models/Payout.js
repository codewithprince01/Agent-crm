const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payout = sequelize.define('Payout', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  payout_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'agents', key: 'id' },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('requested', 'approved', 'rejected', 'paid'),
    defaultValue: 'requested',
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  payment_reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  requested_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  processed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payouts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Payout;
