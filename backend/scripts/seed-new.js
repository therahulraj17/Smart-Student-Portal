/**
 * Fixed Seed Script - Insert data directly using raw MongoDB driver
 */
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected successfully to:', conn.connection.name);

    // Get database
    const db = mongoose.connection.db;

    // Clear collections
    console.log('🗑️  Clearing old demo data...');
    await db.collection('users').deleteMany({ email: { $in: ['admin@demo.com', 'teacher@demo.com', 'student@demo.com', 'student2@demo.com'] } });
    await db.collection('courses').deleteMany({ code: { $in: ['CS101', 'MATH201', 'ENG101'] } });
    console.log('🧹 Cleared');

    // Hash passwords
    console.log('🔐 Hashing passwords...');
    const adminPwd = await bcrypt.hash('Admin@123', 12);
    const teacherPwd = await bcrypt.hash('Teacher@123', 12);
    const studentPwd = await bcrypt.hash('Student@123', 12);
    console.log('✅ Passwords hashed');

    // Insert users directly
    console.log('👥 Inserting demo users...');
    const usersResult = await db.collection('users').insertMany([
      {
        name: 'Admin User',
        email: 'admin@demo.com',
        password: adminPwd,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        enrolledCourses: [],
        teachingCourses: [],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'teacher@demo.com',
        password: teacherPwd,
        role: 'teacher',
        isActive: true,
        isEmailVerified: true,
        enrolledCourses: [],
        teachingCourses: [],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Alex Student',
        email: 'student@demo.com',
        password: studentPwd,
        role: 'student',
        studentId: 'STU2024001',
        isActive: true,
        isEmailVerified: true,
        enrolledCourses: [],
        teachingCourses: [],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Jordan Lee',
        email: 'student2@demo.com',
        password: studentPwd,
        role: 'student',
        studentId: 'STU2024002',
        isActive: true,
        isEmailVerified: true,
        enrolledCourses: [],
        teachingCourses: [],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const userIds = Object.values(usersResult.insertedIds);
    console.log(`✅ Inserted ${userIds.length} users`);

    // Insert courses
    console.log('📚 Inserting courses...');
    const coursesResult = await db.collection('courses').insertMany([
      {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Foundational concepts of computer science',
        teacher: userIds[1], // teacher
        students: [userIds[2], userIds[3]], // students
        semester: 'Spring 2025',
        credits: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Calculus & Linear Algebra',
        code: 'MATH201',
        description: 'Advanced mathematics',
        teacher: userIds[1],
        students: [userIds[2]],
        semester: 'Spring 2025',
        credits: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Technical Writing',
        code: 'ENG101',
        description: 'Professional communication',
        teacher: userIds[1],
        students: [userIds[3]],
        semester: 'Spring 2025',
        credits: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log(`✅ Inserted ${Object.keys(coursesResult.insertedIds).length} courses`);

    // Verify insertion
    console.log('\n📊 Verification:');
    const userCount = await db.collection('users').countDocuments();
    const courseCount = await db.collection('courses').countDocuments();
    console.log(`   Users in DB: ${userCount}`);
    console.log(`   Courses in DB: ${courseCount}`);

    // List users
    const users = await db.collection('users').find({}).toArray();
    console.log('\n👥 Created users:');
    users.forEach(u => console.log(`   ✓ ${u.email} (${u.role})`));

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Demo Credentials:');
    console.log('  Admin:   admin@demo.com    / Admin@123');
    console.log('  Teacher: teacher@demo.com  / Teacher@123');
    console.log('  Student: student@demo.com  / Student@123');
    console.log('  Student: student2@demo.com / Student@123\n');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);
  }
};

seed();
