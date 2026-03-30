const Joi = require('joi');

// ─── Auth Validations ────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
    }),
  role: Joi.string().valid('student', 'teacher').default('student'),
  studentId: Joi.when('role', {
    is: 'student',
    then: Joi.string().alphanum().max(20),
    otherwise: Joi.forbidden(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and a number',
    }),
});

// ─── Assignment Validations ───────────────────────────────────────────────────
const assignmentSchema = Joi.object({
  title: Joi.string().min(3).max(200).trim().required(),
  description: Joi.string().max(5000).trim().required(),
  courseId: Joi.string().hex().length(24).required(),
  dueDate: Joi.date().greater('now').required(),
  totalMarks: Joi.number().integer().min(1).max(1000).default(100),
  allowedFileTypes: Joi.array().items(
    Joi.string().valid('pdf', 'docx', 'txt', 'zip', 'jpg', 'png')
  ).default(['pdf', 'docx']),
});

const gradeSubmissionSchema = Joi.object({
  marks: Joi.number().min(0).required(),
  feedback: Joi.string().max(2000).trim().required(),
});

// ─── Quiz Validations ────────────────────────────────────────────────────────
const quizSchema = Joi.object({
  title: Joi.string().min(3).max(200).trim().required(),
  description: Joi.string().max(2000).trim(),
  courseId: Joi.string().hex().length(24).required(),
  questions: Joi.array().items(
    Joi.object({
      questionText: Joi.string().min(5).max(1000).required(),
      options: Joi.array().items(Joi.string().max(500)).min(2).max(6).required(),
      correctAnswer: Joi.number().integer().min(0).required(),
      marks: Joi.number().min(1).default(1),
    })
  ).min(1).required(),
  timeLimit: Joi.number().integer().min(1).max(300).required(), // in minutes
  dueDate: Joi.date().greater('now').required(),
  shuffleQuestions: Joi.boolean().default(false),
});

// ─── Attendance Validations ──────────────────────────────────────────────────
const attendanceSchema = Joi.object({
  courseId: Joi.string().hex().length(24).required(),
  date: Joi.date().max('now').required(),
  records: Joi.array().items(
    Joi.object({
      studentId: Joi.string().hex().length(24).required(),
      status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
    })
  ).min(1).required(),
});

// ─── Course Validations ──────────────────────────────────────────────────────
const courseSchema = Joi.object({
  name: Joi.string().min(3).max(200).trim().required(),
  code: Joi.string().alphanum().uppercase().min(3).max(20).required(),
  description: Joi.string().max(2000).trim(),
  semester: Joi.string().max(50),
  credits: Joi.number().integer().min(1).max(10),
});

// ─── Chat Validations ────────────────────────────────────────────────────────
const messageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).trim().required(),
  receiverId: Joi.string().hex().length(24).required(),
});

// ─── Notification Validations ────────────────────────────────────────────────
const notificationSchema = Joi.object({
  title: Joi.string().min(3).max(200).trim().required(),
  message: Joi.string().max(1000).trim().required(),
  type: Joi.string().valid('assignment', 'quiz', 'announcement', 'grade', 'reminder').required(),
  targetRole: Joi.string().valid('all', 'student', 'teacher'),
  targetUsers: Joi.array().items(Joi.string().hex().length(24)),
  courseId: Joi.string().hex().length(24),
});

/**
 * Generic validation middleware factory
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors: messages });
  }
  req.body = value;
  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  assignmentSchema,
  gradeSubmissionSchema,
  quizSchema,
  attendanceSchema,
  courseSchema,
  messageSchema,
  notificationSchema,
};
