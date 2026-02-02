const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AgentBankDetail = sequelize.define('AgentBankDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'agents',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  bank_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  account_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  account_holder_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  ifsc_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  swift_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  branch_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'agent_bank_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = AgentBankDetail;
