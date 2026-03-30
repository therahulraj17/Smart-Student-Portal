const cron = require('node-cron');
const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendDeadlineReminderEmail } = require('../utils/emailUtils');
const { emitToUser } = require('../config/socket');
const logger = require('../utils/logger');

const startCronJobs = () => {
  // Run every day at 8:00 AM — send deadline reminders
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running deadline reminder cron job...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      const now = new Date();

      // Find assignments due within 24 hours
      const upcomingAssignments = await Assignment.find({
        dueDate: { $gte: now, $lte: tomorrow },
        isPublished: true,
      }).populate('courseId', 'name students');

      // Find quizzes due within 24 hours
      const upcomingQuizzes = await Quiz.find({
        dueDate: { $gte: now, $lte: tomorrow },
        isPublished: true,
      }).populate('courseId', 'name students');

      // Group by student
      const studentReminders = {};

      upcomingAssignments.forEach((a) => {
        a.courseId.students.forEach((studentId) => {
          const hasSubmitted = a.submissions.some(
            (s) => s.studentId.toString() === studentId.toString()
          );
          if (!hasSubmitted) {
            const key = studentId.toString();
            if (!studentReminders[key]) studentReminders[key] = [];
            studentReminders[key].push({
              title: a.title,
              dueDate: a.dueDate,
              type: 'assignment',
            });
          }
        });
      });

      upcomingQuizzes.forEach((q) => {
        q.courseId.students.forEach((studentId) => {
          const hasAttempted = q.attempts.some(
            (a) => a.studentId.toString() === studentId.toString() && a.isCompleted
          );
          if (!hasAttempted) {
            const key = studentId.toString();
            if (!studentReminders[key]) studentReminders[key] = [];
            studentReminders[key].push({
              title: q.title,
              dueDate: q.dueDate,
              type: 'quiz',
            });
          }
        });
      });

      // Send reminders
      for (const [studentId, items] of Object.entries(studentReminders)) {
        const student = await User.findById(studentId).select('name email notificationPreferences');
        if (!student) continue;

        // In-app notification
        const notification = await Notification.create({
          title: '⏰ Deadline Reminder',
          message: `You have ${items.length} item(s) due within 24 hours`,
          type: 'reminder',
          recipients: [{ userId: studentId }],
          link: '/dashboard',
        });

        emitToUser(studentId, 'notification', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: 'reminder',
          createdAt: notification.createdAt,
        });

        // Email reminder (if opted in)
        if (student.notificationPreferences?.email) {
          await sendDeadlineReminderEmail(student.email, student.name, items).catch((err) =>
            logger.error(`Failed to send reminder email to ${student.email}:`, err.message)
          );
        }
      }

      logger.info(`Deadline reminders sent to ${Object.keys(studentReminders).length} students`);
    } catch (err) {
      logger.error('Cron job error (deadline reminders):', err.message);
    }
  });

  logger.info('✅ Cron jobs initialized');
};

module.exports = { startCronJobs };
