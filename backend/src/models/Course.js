const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  university_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'universities',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  level: {
    type: DataTypes.ENUM('Foundation', 'Undergraduate', 'Postgraduate', 'Diploma', 'Certificate', 'PhD'),
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  tuition_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  intake_dates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of intake dates',
  },
  eligibility: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  },
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Course;
