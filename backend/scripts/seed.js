/**
 * Seed script — creates demo users, courses, assignments, and quizzes
 * Run: node scripts/seed.js
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Minimal inline models for seeding
const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  role: String, isActive: { type: Boolean, default: true },
  enrolledCourses: [mongoose.Schema.Types.ObjectId],
  teachingCourses: [mongoose.Schema.Types.ObjectId],
  refreshTokens: [String],
}, { timestamps: true });

// NO pre-save hook here — we hash manually before insert
const User = mongoose.models.User || mongoose.model('User', userSchema);

const courseSchema = new mongoose.Schema({
  name: String, code: { type: String, unique: true }, description: String,
  teacher: mongoose.Schema.Types.ObjectId, students: [mongoose.Schema.Types.ObjectId],
  semester: String, credits: Number, isActive: { type: Boolean, default: true },
}, { timestamps: true });
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

const assignmentSchema = new mongoose.Schema({
  title: String, description: String, courseId: mongoose.Schema.Types.ObjectId,
  teacherId: mongoose.Schema.Types.ObjectId, dueDate: Date,
  totalMarks: Number, allowedFileTypes: [String], submissions: [], isPublished: Boolean,
}, { timestamps: true });
const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

const quizSchema = new mongoose.Schema({
  title: String, description: String, courseId: mongoose.Schema.Types.ObjectId,
  teacherId: mongoose.Schema.Types.ObjectId, questions: [], timeLimit: Number,
  dueDate: Date, shuffleQuestions: Boolean, attempts: [], isPublished: Boolean,
}, { timestamps: true });
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_student_portal');
    console.log('✅ Connected to MongoDB');

    // Clear existing demo data
    await Promise.all([
      User.deleteMany({ email: { $in: ['admin@demo.com', 'teacher@demo.com', 'student@demo.com', 'student2@demo.com'] } }),
      Course.deleteMany({ code: { $in: ['CS101', 'MATH201', 'ENG101'] } }),
    ]);
    console.log('🧹 Cleared existing demo data');

    // Hash passwords ONCE before inserting
    const adminHash   = await bcrypt.hash('Admin@123',   12);
    const teacherHash = await bcrypt.hash('Teacher@123', 12);
    const studentHash = await bcrypt.hash('Student@123', 12);

    // Use insertMany — no pre-save hook, passwords already hashed above
    const [admin, teacher, student1, student2] = await User.insertMany([
      { name: 'Admin User',       email: 'admin@demo.com',    password: adminHash,   role: 'admin'   },
      { name: 'Dr. Sarah Johnson',email: 'teacher@demo.com',  password: teacherHash, role: 'teacher' },
      { name: 'Alex Student',     email: 'student@demo.com',  password: studentHash, role: 'student', studentId: 'STU2024001' },
      { name: 'Jordan Lee',       email: 'student2@demo.com', password: studentHash, role: 'student', studentId: 'STU2024002' },
    ]);
    console.log('👥 Created demo users');

    // Create courses
    const courses = await Course.insertMany([
      {
        name: 'Introduction to Computer Science', code: 'CS101',
        description: 'Foundational concepts of computer science including algorithms, data structures, and programming.',
        teacher: teacher._id, students: [student1._id, student2._id],
        semester: 'Spring 2025', credits: 3,
      },
      {
        name: 'Calculus & Linear Algebra', code: 'MATH201',
        description: 'Advanced mathematics covering differential calculus, integration, and linear algebra.',
        teacher: teacher._id, students: [student1._id],
        semester: 'Spring 2025', credits: 4,
      },
      {
        name: 'Technical Writing', code: 'ENG101',
        description: 'Professional communication skills for engineers and scientists.',
        teacher: teacher._id, students: [student2._id],
        semester: 'Spring 2025', credits: 2,
      },
    ]);

    // Update teacher and students with course references
    await User.findByIdAndUpdate(teacher._id,  { teachingCourses: courses.map((c) => c._id) });
    await User.findByIdAndUpdate(student1._id, { enrolledCourses: [courses[0]._id, courses[1]._id] });
    await User.findByIdAndUpdate(student2._id, { enrolledCourses: [courses[0]._id, courses[2]._id] });
    console.log('📚 Created demo courses');

    // Create assignments
    const future7  = new Date(Date.now() + 7  * 24 * 60 * 60 * 1000);
    const future14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await Assignment.insertMany([
      {
        title: 'Algorithm Analysis Report',
        description: 'Write a detailed report analyzing the time and space complexity of at least 5 sorting algorithms. Include pseudocode, Big-O analysis, and real-world use cases.\n\nRequirements:\n- Min 1500 words\n- Compare bubble sort, merge sort, quick sort, heap sort, and counting sort\n- Include performance benchmarks',
        courseId: courses[0]._id, teacherId: teacher._id,
        dueDate: future7, totalMarks: 100,
        allowedFileTypes: ['pdf', 'docx'], isPublished: true,
      },
      {
        title: 'Linked List Implementation',
        description: 'Implement a doubly linked list in Python with the following operations:\n- insert_front(), insert_end(), insert_at(pos)\n- delete_front(), delete_end(), delete_at(pos)\n- search(), reverse(), display()\n\nSubmit as a .zip with code and test cases.',
        courseId: courses[0]._id, teacherId: teacher._id,
        dueDate: future14, totalMarks: 50,
        allowedFileTypes: ['zip', 'py'], isPublished: true,
      },
      {
        title: 'Calculus Problem Set 3',
        description: 'Complete problems 1-20 from Chapter 7 (Integration by Parts) and 1-15 from Chapter 8 (Partial Fractions). Show all working clearly.',
        courseId: courses[1]._id, teacherId: teacher._id,
        dueDate: future7, totalMarks: 80,
        allowedFileTypes: ['pdf'], isPublished: true,
      },
    ]);
    console.log('📝 Created demo assignments');

    // Create quiz
    const future3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await Quiz.insertMany([
      {
        title: 'Data Structures Fundamentals Quiz',
        description: 'Test your knowledge of fundamental data structures covered in the first 4 weeks.',
        courseId: courses[0]._id, teacherId: teacher._id,
        timeLimit: 30, dueDate: future3,
        isPublished: true, shuffleQuestions: true,
        questions: [
          { questionText: 'What is the time complexity of binary search?',             options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],                  correctAnswer: 1, marks: 2 },
          { questionText: 'Which data structure uses LIFO (Last In, First Out)?',      options: ['Queue', 'Array', 'Stack', 'Linked List'],              correctAnswer: 2, marks: 2 },
          { questionText: 'What is the worst-case time complexity of quicksort?',      options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'],            correctAnswer: 2, marks: 2 },
          { questionText: 'Which traversal visits: Left → Root → Right?',             options: ['Preorder', 'Postorder', 'Level-order', 'Inorder'],     correctAnswer: 3, marks: 2 },
          { questionText: 'A hash table has O(1) average case for which operation?',  options: ['Traversal', 'Sorting', 'Lookup', 'None of the above'], correctAnswer: 2, marks: 2 },
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
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
