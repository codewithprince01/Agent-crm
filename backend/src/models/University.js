const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const University = sequelize.define('University', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  logo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  contact_email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  agreement_status: {
    type: DataTypes.ENUM('pending', 'active', 'expired'),
    defaultValue: 'pending',
  },
  agreement_start_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  agreement_end_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'universities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = University;
