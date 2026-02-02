# PowerShell script to generate all remaining backend models

$models = @{
    "Student" = @"
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'agents', key: 'id' },
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: true,
  },
  nationality: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  passport_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  passport_expiry: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  postal_code: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  academic_level: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'students',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Student;
"@

    "StudentDocument" = @"
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentDocument = sequelize.define('StudentDocument', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'students', key: 'id' },
    onDelete: 'CASCADE',
  },
  document_type: {
    type: DataTypes.ENUM('passport', 'academic_transcript', 'degree_certificate', 'english_proficiency', 'cv', 'sop', 'lor', 'other'),
    allowNull: false,
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verified_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'student_documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = StudentDocument;
"@

    "Application" = @"
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
"@

    "ApplicationStatusHistory" = @"
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
"@

    "CommissionRule" = @"
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
"@

    "Commission" = @"
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
"@

    "Payout" = @"
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
"@

    "AuditLog" = @"
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entity: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  old_value: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  new_value: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = AuditLog;
"@
}

# Create each model file
foreach ($modelName in $models.Keys) {
    $filePath = "src\models\$modelName.js"
    $content = $models[$modelName]
    Set-Content -Path $filePath -Value $content
    Write-Host "Created $filePath"
}

Write-Host "`nAll models created successfully!"
