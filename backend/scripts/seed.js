/**
 * Seed script — creates demo users, courses, assignments, and quizzes
 * Run: node scripts/seed.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');

const seed = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_student_portal');
    console.log('✅ Connected to MongoDB');

    // Clear existing demo data
    console.log('🗑️  Clearing existing demo data...');
    const deleteResult = await Promise.all([
      User.deleteMany({ email: { $in: ['admin@demo.com', 'teacher@demo.com', 'student@demo.com', 'student2@demo.com'] } }),
      Course.deleteMany({ code: { $in: ['CS101', 'MATH201', 'ENG101'] } }),
    ]);
    console.log('🧹 Cleared existing demo data');

    // Create users with explicit error handling
    console.log('👤 Creating admin...');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
    }).catch(err => { throw new Error('Admin creation failed: ' + err.message); });

    console.log('👤 Creating teacher...');
    const teacher = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'teacher@demo.com',
      password: 'Teacher@123',
      role: 'teacher',
      isEmailVerified: true,
    }).catch(err => { throw new Error('Teacher creation failed: ' + err.message); });

    console.log('👤 Creating student1...');
    const student1 = await User.create({
      name: 'Alex Student',
      email: 'student@demo.com',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU2024001',
      isEmailVerified: true,
    }).catch(err => { throw new Error('Student1 creation failed: ' + err.message); });

    console.log('👤 Creating student2...');
    const student2 = await User.create({
      name: 'Jordan Lee',
      email: 'student2@demo.com',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU2024002',
      isEmailVerified: true,
    }).catch(err => { throw new Error('Student2 creation failed: ' + err.message); });
    
    console.log('✅ Created demo users:', [admin._id, teacher._id, student1._id, student2._id].join(', '));

    // Create courses
    const courses = await Course.insertMany([
      {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Foundational concepts of computer science including algorithms, data structures, and programming.',
        teacher: teacher._id,
        students: [student1._id, student2._id],
        semester: 'Spring 2025',
        credits: 3,
        isActive: true,
      },
      {
        name: 'Calculus & Linear Algebra',
        code: 'MATH201',
        description: 'Advanced mathematics covering differential calculus, integration, and linear algebra.',
        teacher: teacher._id,
        students: [student1._id],
        semester: 'Spring 2025',
        credits: 4,
        isActive: true,
      },
      {
        name: 'Technical Writing',
        code: 'ENG101',
        description: 'Professional communication skills for engineers and scientists.',
        teacher: teacher._id,
        students: [student2._id],
        semester: 'Spring 2025',
        credits: 2,
        isActive: true,
      },
    ]);

    // Update teacher and students with course references
    await User.findByIdAndUpdate(teacher._id, { teachingCourses: courses.map((c) => c._id) });
    await User.findByIdAndUpdate(student1._id, { enrolledCourses: [courses[0]._id, courses[1]._id] });
    await User.findByIdAndUpdate(student2._id, { enrolledCourses: [courses[0]._id, courses[2]._id] });
    console.log('📚 Created demo courses');

    // Create assignments
    const future7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const future14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await Assignment.insertMany([
      {
        title: 'Algorithm Analysis Report',
        description: 'Write a detailed report analyzing sorting algorithms. Min 1500 words.',
        courseId: courses[0]._id,
        teacherId: teacher._id,
        dueDate: future7,
        totalMarks: 100,
        allowedFileTypes: ['pdf', 'docx'],
        isPublished: true,
      },
      {
        title: 'Linked List Implementation',
        description: 'Implement a doubly linked list in Python with various operations.',
        courseId: courses[0]._id,
        teacherId: teacher._id,
        dueDate: future14,
        totalMarks: 50,
        allowedFileTypes: ['zip', 'py'],
        isPublished: true,
      },
      {
        title: 'Calculus Problem Set 3',
        description: 'Complete problems 1-20 from Chapter 7. Show all working clearly.',
        courseId: courses[1]._id,
        teacherId: teacher._id,
        dueDate: future7,
        totalMarks: 80,
        allowedFileTypes: ['pdf'],
        isPublished: true,
      },
    ]);
    console.log('📝 Created demo assignments');

    // Create quiz
    const future3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await Quiz.insertMany([
      {
        title: 'Data Structures Fundamentals Quiz',
        description: 'Test your knowledge of fundamental data structures.',
        courseId: courses[0]._id,
        teacherId: teacher._id,
        timeLimit: 30,
        dueDate: future3,
        isPublished: true,
        shuffleQuestions: true,
        questions: [
          { questionText: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 1, marks: 2 },
          { questionText: 'Which data structure uses LIFO?', options: ['Queue', 'Array', 'Stack', 'Linked List'], correctAnswer: 2, marks: 2 },
        ],
      },
    ]);
    console.log('🧪 Created demo quiz');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Demo Credentials:');
    console.log('  Admin:   admin@demo.com    / Admin@123');
    console.log('  Teacher: teacher@demo.com  / Teacher@123');
    console.log('  Student: student@demo.com  / Student@123');
    console.log('  Student: student2@demo.com / Student@123\n');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error('Full error:', err);
  } finally {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected');
    process.exit(0);
  }
};

seed();
