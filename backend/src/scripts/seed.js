const {
  sequelize,
  User,
  University,
  Course,
  Agent,
  Student,
  CommissionRule,
} = require('../models');
const bcrypt = require('bcryptjs');
const { USER_ROLES, COMMISSION_TYPE, COMMISSION_PRIORITY } = require('../utils/constants');

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected');

    await sequelize.sync({ force: true });
    console.log('✅ Synced');

    // Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@universitycrm.com',
      password: 'admin123',
      role: USER_ROLES.SUPER_ADMIN,
      phone: '+1234567890',
      status: 'active',
    });
    console.log(`✅ Super Admin created: ${superAdmin.email}`);

    console.log('🎉 Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedDatabase();
