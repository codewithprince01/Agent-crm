const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApplicationStatusHistory = sequelize.define('ApplicationStatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  application_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'applications', key: 'id' },
    onDelete: 'CASCADE',
  },
  old_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  new_status: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  changed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'application_status_history',
  timestamps: false,
});

module.exports = ApplicationStatusHistory;
