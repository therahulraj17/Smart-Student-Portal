const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/combinedControllers');
const { validate, attendanceSchema, courseSchema, messageSchema } = require('../utils/validators');
const { uploadAny, setUploadFolder } = require('../middleware/uploadMiddleware');

// ── Attendance ──────────────────────────────────────────────────
const attendanceRouter = express.Router();
attendanceRouter.use(protect);
attendanceRouter.post('/', authorize('teacher'), validate(attendanceSchema), ctrl.markAttendance);
attendanceRouter.get('/my', authorize('student'), ctrl.getMyAttendance);
attendanceRouter.get('/course/:courseId', authorize('teacher', 'admin'), ctrl.getCourseAttendance);

// ── Dashboard ───────────────────────────────────────────────────
const dashboardRouter = express.Router();
dashboardRouter.get('/', protect, ctrl.getDashboard);

// ── Admin ───────────────────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.use(protect, authorize('admin'));
adminRouter.get('/users', ctrl.getAllUsers);
adminRouter.put('/users/:id', ctrl.updateUser);
adminRouter.delete('/users/:id', ctrl.deleteUser);
adminRouter.get('/reports', ctrl.getReports);

// ── User (self-service) ─────────────────────────────────────────
const userRouter = express.Router();
userRouter.use(protect);
userRouter.get('/', authorize('admin', 'teacher'), ctrl.getAllUsers);

// ── Notifications ───────────────────────────────────────────────
const notificationRouter = express.Router();
notificationRouter.use(protect);
notificationRouter.get('/', ctrl.getNotifications);
notificationRouter.put('/:id/read', ctrl.markNotificationRead);
notificationRouter.put('/mark-all-read', ctrl.markAllRead);

// ── Chat ────────────────────────────────────────────────────────
const chatRouter = express.Router();
chatRouter.use(protect);
chatRouter.get('/users', ctrl.getChatUsers);
chatRouter.get('/messages/:userId', ctrl.getMessages);
chatRouter.post('/messages', validate(messageSchema), ctrl.sendMessage);

// ── Materials ───────────────────────────────────────────────────
const materialRouter = express.Router();
materialRouter.use(protect);
materialRouter.get('/', ctrl.getMaterials);
materialRouter.post('/', authorize('teacher', 'admin'), setUploadFolder('materials'), uploadAny.single('file'), ctrl.uploadMaterial);
materialRouter.delete('/:id', authorize('teacher', 'admin'), ctrl.deleteMaterial);

// ── Courses ─────────────────────────────────────────────────────
const courseRouter = express.Router();
courseRouter.use(protect);
courseRouter.get('/', ctrl.getCourses);
courseRouter.post('/', authorize('admin', 'teacher'), validate(courseSchema), ctrl.createCourse);
courseRouter.post('/enroll', authorize('student'), ctrl.enrollInCourse);

// ── Calendar ────────────────────────────────────────────────────
const calendarRouter = express.Router();
calendarRouter.use(protect);
calendarRouter.get('/', ctrl.getCalendarEvents);
calendarRouter.post('/', authorize('teacher', 'admin'), ctrl.createCalendarEvent);

module.exports = {
  attendanceRouter, dashboardRouter, adminRouter, userRouter,
  notificationRouter, chatRouter, materialRouter, courseRouter, calendarRouter,
};
