// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Notification = require('../models/Notification');
const Material = require('../models/Material');
const Message = require('../models/Message');
const CalendarEvent = require('../models/CalendarEvent');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');
const { emitToUser } = require('../config/socket');

// ─── Mark Attendance ──────────────────────────────────────────────────────────
const markAttendance = asyncHandler(async (req, res) => {
  const { courseId, date, records } = req.body;

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.teacher.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOneAndUpdate(
    { courseId, date: attendanceDate },
    { courseId, date: attendanceDate, teacherId: req.user._id, records },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Attendance marked', data: { attendance } });
});

// ─── Get Course Attendance (Teacher) ─────────────────────────────────────────
const getCourseAttendance = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { startDate, endDate } = req.query;

  const query = { courseId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }

  const records = await Attendance.find(query)
    .populate('records.studentId', 'name email studentId')
    .sort({ date: -1 });

  res.status(200).json({ success: true, data: { records } });
});

// ─── Get Student Attendance Summary ───────────────────────────────────────────
const getMyAttendance = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  const studentId = req.user._id;

  const courses = courseId
    ? [courseId]
    : req.user.enrolledCourses.map((c) => c.toString());

  const results = await Promise.all(
    courses.map(async (cId) => {
      const records = await Attendance.find({
        courseId: cId,
        'records.studentId': studentId,
      });

      const total = records.length;
      const present = records.filter((r) =>
        r.records.find(
          (rec) => rec.studentId.toString() === studentId.toString() &&
                   ['present', 'late'].includes(rec.status)
        )
      ).length;

      const course = await Course.findById(cId).select('name code');
      return {
        course,
        total,
        present,
        absent: total - present,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    })
  );

  res.status(200).json({ success: true, data: { attendance: results } });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const role = req.user.role;
  let data = {};

  if (role === 'student') {
    const courses = req.user.enrolledCourses;

    // Upcoming assignments
    const assignments = await Assignment.find({
      courseId: { $in: courses },
      dueDate: { $gte: new Date() },
      isPublished: true,
    })
      .populate('courseId', 'name')
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();

    // Recent quizzes
    const quizzes = await Quiz.find({
      courseId: { $in: courses },
      isPublished: true,
    })
      .select('-questions.correctAnswer -attempts')
      .populate('courseId', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    // Notifications
    const notifications = await Notification.find({
      'recipients.userId': userId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Productivity: assignment completion rate
    const allAssignments = await Assignment.find({
      courseId: { $in: courses },
      isPublished: true,
    });
    const submitted = allAssignments.filter((a) =>
      a.submissions.some((s) => s.studentId.toString() === userId.toString())
    ).length;

    // Attendance summary
    const attendanceRecords = await Attendance.find({
      courseId: { $in: courses },
      'records.studentId': userId,
    });
    const attendedCount = attendanceRecords.filter((r) =>
      r.records.some(
        (rec) =>
          rec.studentId.toString() === userId.toString() &&
          ['present', 'late'].includes(rec.status)
      )
    ).length;

    data = {
      stats: {
        enrolledCourses: courses.length,
        completionRate: allAssignments.length
          ? Math.round((submitted / allAssignments.length) * 100)
          : 0,
        attendanceRate: attendanceRecords.length
          ? Math.round((attendedCount / attendanceRecords.length) * 100)
          : 0,
        unreadNotifications: notifications.filter(
          (n) => !n.recipients.find((r) => r.userId.toString() === userId.toString())?.isRead
        ).length,
      },
      upcomingAssignments: assignments,
      recentQuizzes: quizzes,
      notifications: notifications.slice(0, 5),
    };
  } else if (role === 'teacher') {
    const courses = req.user.teachingCourses;

    const totalStudents = await User.countDocuments({
      enrolledCourses: { $in: courses },
      role: 'student',
    });
    const pendingGrading = await Assignment.aggregate([
      { $match: { teacherId: userId } },
      { $unwind: '$submissions' },
      { $match: { 'submissions.status': 'submitted' } },
      { $count: 'total' },
    ]);

    const recentAssignments = await Assignment.find({ teacherId: userId })
      .populate('courseId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    data = {
      stats: {
        teachingCourses: courses.length,
        totalStudents,
        pendingGrading: pendingGrading[0]?.total || 0,
      },
      recentAssignments,
    };
  } else if (role === 'admin') {
    const [totalUsers, totalCourses, totalAssignments, totalQuizzes] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Assignment.countDocuments(),
      Quiz.countDocuments(),
    ]);
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    data = { stats: { totalUsers, totalCourses, totalAssignments, totalQuizzes, usersByRole } };
  }

  res.status(200).json({ success: true, data });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: { users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const allowed = ['name', 'role', 'isActive', 'enrolledCourses'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!user) throw new ApiError('User not found', 404);

  res.status(200).json({ success: true, message: 'User updated', data: { user } });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError('User not found', 404);
  if (user.role === 'admin') throw new ApiError('Cannot delete admin users', 403);

  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted' });
});

const getReports = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [newUsers, submissions, quizAttempts] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Assignment.aggregate([
      { $unwind: '$submissions' },
      { $match: { 'submissions.submittedAt': { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submissions.submittedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Quiz.aggregate([
      { $unwind: '$attempts' },
      { $match: { 'attempts.isCompleted': true, 'attempts.submittedAt': { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$attempts.submittedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.status(200).json({ success: true, data: { newUsers, submissions, quizAttempts } });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    'recipients.userId': req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'name')
    .lean();

  const enriched = notifications.map((n) => ({
    ...n,
    isRead: n.recipients.find((r) => r.userId.toString() === req.user._id.toString())?.isRead || false,
  }));

  res.status(200).json({ success: true, data: { notifications: enriched } });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.updateOne(
    { _id: req.params.id, 'recipients.userId': req.user._id },
    { $set: { 'recipients.$.isRead': true, 'recipients.$.readAt': new Date() } }
  );
  res.status(200).json({ success: true, message: 'Marked as read' });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { 'recipients.userId': req.user._id, 'recipients.isRead': false },
    { $set: { 'recipients.$.isRead': true, 'recipients.$.readAt': new Date() } }
  );
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const getChatUsers = asyncHandler(async (req, res) => {
  let query = { isActive: true, _id: { $ne: req.user._id } };

  if (req.user.role === 'student') {
    // Students can only message teachers of their courses
    const courses = await Course.find({ students: req.user._id }).select('teacher');
    const teacherIds = courses.map((c) => c.teacher);
    query._id = { $in: teacherIds };
  } else if (req.user.role === 'teacher') {
    // Teachers can message their students
    const courses = await Course.find({ teacher: req.user._id }).select('students');
    const studentIds = courses.flatMap((c) => c.students);
    query._id = { $in: [...new Set(studentIds.map((id) => id.toString()))] };
  }

  const users = await User.find(query).select('name email role avatar');
  res.status(200).json({ success: true, data: { users } });
});

const getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const roomId = Message.getRoomId(req.user._id, userId);
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await Message.find({ roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('senderId', 'name avatar')
    .lean();

  // Mark as read
  await Message.updateMany(
    { roomId, receiverId: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({ success: true, data: { messages: messages.reverse(), roomId } });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { content, receiverId } = req.body;
  const receiver = await User.findById(receiverId);
  if (!receiver) throw new ApiError('Recipient not found', 404);

  const roomId = Message.getRoomId(req.user._id, receiverId);
  const message = await Message.create({
    roomId,
    senderId: req.user._id,
    receiverId,
    content,
  });

  await message.populate('senderId', 'name avatar');

  // Real-time delivery
  emitToUser(receiverId, 'receive_message', {
    ...message.toJSON(),
    roomId,
  });

  res.status(201).json({ success: true, data: { message } });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MATERIAL CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const uploadMaterial = asyncHandler(async (req, res) => {
  const { title, description, courseId, type, externalUrl, tags } = req.body;

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError('Course not found', 404);

  if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const fileData = req.file ? {
    originalName: req.file.originalname,
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype,
  } : null;

  const material = await Material.create({
    title, description, courseId,
    uploadedBy: req.user._id,
    type: type || (req.file ? 'pdf' : 'link'),
    file: fileData,
    externalUrl,
    tags: tags ? tags.split(',').map((t) => t.trim()) : [],
  });

  res.status(201).json({ success: true, message: 'Material uploaded', data: { material } });
});

const getMaterials = asyncHandler(async (req, res) => {
  const { courseId, type } = req.query;
  const query = { isPublished: true };

  if (req.user.role === 'student') {
    query.courseId = { $in: req.user.enrolledCourses };
  } else if (req.user.role === 'teacher') {
    query.courseId = { $in: req.user.teachingCourses };
  }
  if (courseId) query.courseId = courseId;
  if (type) query.type = type;

  const materials = await Material.find(query)
    .populate('courseId', 'name code')
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { materials } });
});

const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) throw new ApiError('Material not found', 404);
  if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError('Not authorized', 403);
  }
  await material.deleteOne();
  res.status(200).json({ success: true, message: 'Material deleted' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const createCourse = asyncHandler(async (req, res) => {
  const { name, code, description, semester, credits } = req.body;

  const existing = await Course.findOne({ code });
  if (existing) throw new ApiError('Course code already exists', 409);

  const course = await Course.create({
    name, code, description, semester, credits,
    teacher: req.user.role === 'admin' ? (req.body.teacherId || req.user._id) : req.user._id,
  });

  // Add to teacher's teachingCourses
  await User.findByIdAndUpdate(course.teacher, {
    $addToSet: { teachingCourses: course._id },
  });

  res.status(201).json({ success: true, message: 'Course created', data: { course } });
});

const getCourses = asyncHandler(async (req, res) => {
  let query = { isActive: true };

  if (req.user.role === 'student') {
    query._id = { $in: req.user.enrolledCourses };
  } else if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
  }

  const courses = await Course.find(query)
    .populate('teacher', 'name email')
    .populate('students', 'name email studentId');

  res.status(200).json({ success: true, data: { courses } });
});

const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) throw new ApiError('Course not found', 404);

  if (course.students.includes(req.user._id)) {
    throw new ApiError('Already enrolled in this course', 409);
  }

  course.students.push(req.user._id);
  await course.save();

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { enrolledCourses: courseId },
  });

  res.status(200).json({ success: true, message: `Enrolled in ${course.name}` });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CALENDAR CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
const getCalendarEvents = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const start = new Date(year || new Date().getFullYear(), (month || new Date().getMonth()), 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

  const query = {
    startDate: { $gte: start, $lte: end },
    $or: [
      { targetRole: 'all' },
      { targetRole: req.user.role },
      { targetUsers: req.user._id },
    ],
  };

  if (req.user.role === 'student') {
    query.courseId = { $in: [...req.user.enrolledCourses, null] };
  }

  const events = await CalendarEvent.find(query)
    .populate('courseId', 'name code')
    .sort({ startDate: 1 });

  res.status(200).json({ success: true, data: { events } });
});

const createCalendarEvent = asyncHandler(async (req, res) => {
  const event = await CalendarEvent.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: { event } });
});

module.exports = {
  // Attendance
  markAttendance, getCourseAttendance, getMyAttendance,
  // Dashboard
  getDashboard,
  // Admin
  getAllUsers, updateUser, deleteUser, getReports,
  // Notifications
  getNotifications, markNotificationRead, markAllRead,
  // Chat
  getChatUsers, getMessages, sendMessage,
  // Materials
  uploadMaterial, getMaterials, deleteMaterial,
  // Courses
  createCourse, getCourses, enrollInCourse,
  // Calendar
  getCalendarEvents, createCalendarEvent,
};
