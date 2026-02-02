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
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync database (force: true drops existing tables)
    // WARNING: Don't use force: true in production!
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (Tables recreated)');

    console.log('🌱 Seeding data...');

    // 1. Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@universitycrm.com',
      password: 'admin123', // Will be hashed by model hook
      role: USER_ROLES.SUPER_ADMIN,
      phone: '+1234567890',
      status: 'active',
    });
    console.log(`✅ Super Admin created: ${superAdmin.email}`);

    // 2. Create Universities
    const universities = await University.bulkCreate([
      {
        name: 'Harvard University',
        country: 'USA',
        city: 'Cambridge',
        website: 'https://harvard.edu',
        agreement_status: 'active',
        status: 'active',
      },
      {
        name: 'University of Oxford',
        country: 'UK',
        city: 'Oxford',
        website: 'https://ox.ac.uk',
        agreement_status: 'active',
        status: 'active',
      },
      {
        name: 'University of Toronto',
        country: 'Canada',
        city: 'Toronto',
        website: 'https://utoronto.ca',
        agreement_status: 'pending',
        status: 'active',
      },
    ]);
    console.log(`✅ ${universities.length} Universities created`);

    // 3. Create Courses
    const courses = await Course.bulkCreate([
      {
        university_id: universities[0].id,
        name: 'Master of Business Administration (MBA)',
        level: 'Postgraduate',
        duration: '2 years',
        tuition_fee: 75000,
        currency: 'USD',
        status: 'active',
        intake_dates: JSON.stringify(['2024-09-01', '2025-01-01']),
      },
      {
        university_id: universities[0].id,
        name: 'BSc Computer Science',
        level: 'Undergraduate',
        duration: '4 years',
        tuition_fee: 55000,
        currency: 'USD',
        status: 'active',
      },
      {
        university_id: universities[1].id,
        name: 'MSc Data Science',
        level: 'Postgraduate',
        duration: '1 year',
        tuition_fee: 35000,
        currency: 'GBP',
        status: 'active',
      },
    ]);
    console.log(`✅ ${courses.length} Courses created`);

    // 4. Create an Agent
    const agentUser = await User.create({
      name: 'John Agent',
      email: 'agent@test.com',
      password: 'agent123',
      role: USER_ROLES.AGENT,
      phone: '+9876543210',
      status: 'active',
    });

    const agent = await Agent.create({
      user_id: agentUser.id,
      company_name: 'Global Education Consultants',
      country: 'India',
      city: 'Delhi',
      approval_status: 'approved',
      approved_by: superAdmin.id,
      approved_at: new Date(),
    });
    console.log(`✅ Agent created: ${agentUser.email}`);

    // 5. Create Commission Rules
    await CommissionRule.bulkCreate([
      {
        university_id: universities[0].id,
        commission_type: COMMISSION_TYPE.PERCENTAGE,
        commission_value: 15, // 15% for Harvard
        priority_level: COMMISSION_PRIORITY.UNIVERSITY_DEFAULT,
        active: true,
      },
      {
        university_id: universities[1].id,
        commission_type: COMMISSION_TYPE.FLAT,
        commission_value: 2000, // Flat £2000 for Oxford
        priority_level: COMMISSION_PRIORITY.UNIVERSITY_DEFAULT,
        active: true,
      },
      {
        agent_id: agent.id,
        course_id: courses[0].id,
        commission_type: COMMISSION_TYPE.PERCENTAGE,
        commission_value: 20, // 20% special for this agent on MBA
        priority_level: COMMISSION_PRIORITY.AGENT_COURSE,
        active: true,
      },
    ]);
    console.log('✅ Commission rules created');

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
