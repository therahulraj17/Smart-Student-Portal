const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const CalendarEvent = require('../models/CalendarEvent');
const Notification = require('../models/Notification');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');
const { emitToUser } = require('../config/socket');

// ─── Create Quiz ──────────────────────────────────────────────────────────────
exports.createQuiz = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.teacher.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to create quizzes for this course', 403);
  }

  const quiz = await Quiz.create({ ...req.body, teacherId: req.user._id });

  await CalendarEvent.create({
    title: `Quiz: ${quiz.title}`,
    type: 'quiz',
    startDate: quiz.dueDate,
    courseId,
    createdBy: req.user._id,
    targetRole: 'student',
    color: '#8b5cf6',
    refId: quiz._id,
    refModel: 'Quiz',
  });

  // Notify students
  const students = course.students;
  if (students.length > 0) {
    await Notification.create({
      title: 'New Quiz Available',
      message: `"${quiz.title}" is now available in ${course.name}. Time limit: ${quiz.timeLimit} min`,
      type: 'quiz',
      recipients: students.map((s) => ({ userId: s })),
      sender: req.user._id,
      courseId,
      link: `/quizzes/${quiz._id}`,
    });
    students.forEach((id) =>
      emitToUser(id, 'notification', { title: 'New Quiz Available', type: 'quiz' })
    );
  }

  res.status(201).json({ success: true, message: 'Quiz created', data: { quiz } });
});

// ─── Get Quizzes ──────────────────────────────────────────────────────────────
exports.getQuizzes = asyncHandler(async (req, res) => {
  const { courseId } = req.query;
  let query = {};

  if (req.user.role === 'teacher') {
    query.teacherId = req.user._id;
  } else {
    query.courseId = { $in: req.user.enrolledCourses };
    query.isPublished = true;
  }
  if (courseId) query.courseId = courseId;

  // For students, exclude correct answers
  const projection = req.user.role === 'student'
    ? '-questions.correctAnswer -attempts'
    : '';

  const quizzes = await Quiz.find(query)
    .select(projection)
    .populate('courseId', 'name code')
    .populate('teacherId', 'name')
    .sort({ dueDate: 1 })
    .lean();

  // Mark attempt status for students
  if (req.user.role === 'student') {
    const fullQuizzes = await Quiz.find(query).select('attempts').lean();
    quizzes.forEach((q, i) => {
      const full = fullQuizzes[i];
      const attempt = full?.attempts?.find(
        (a) => a.studentId?.toString() === req.user._id.toString() && a.isCompleted
      );
      q.myAttempt = attempt
        ? { score: attempt.score, percentage: attempt.percentage, grade: attempt.grade }
        : null;
    });
  }

  res.status(200).json({ success: true, data: { quizzes, count: quizzes.length } });
});

// ─── Get Single Quiz (with/without answers) ───────────────────────────────────
exports.getQuiz = asyncHandler(async (req, res) => {
  let quiz;

  if (req.user.role === 'student') {
    quiz = await Quiz.findById(req.params.id)
      .select('-questions.correctAnswer')
      .populate('courseId', 'name code');
    if (!quiz) throw new ApiError('Quiz not found', 404);

    // Check if already attempted
    const fullQuiz = await Quiz.findById(req.params.id).select('attempts');
    const attempt = fullQuiz.attempts.find(
      (a) => a.studentId.toString() === req.user._id.toString() && a.isCompleted
    );
    return res.status(200).json({
      success: true,
      data: { quiz, alreadyAttempted: !!attempt, myAttempt: attempt || null },
    });
  }

  quiz = await Quiz.findById(req.params.id)
    .populate('courseId', 'name code')
    .populate('attempts.studentId', 'name email studentId');

  if (!quiz) throw new ApiError('Quiz not found', 404);
  res.status(200).json({ success: true, data: { quiz } });
});

// ─── Start Quiz Attempt ───────────────────────────────────────────────────────
exports.startAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError('Quiz not found', 404);

  if (new Date() > new Date(quiz.dueDate)) {
    throw new ApiError('Quiz deadline has passed', 400);
  }

  const existingAttempt = quiz.attempts.find(
    (a) => a.studentId.toString() === req.user._id.toString()
  );
  if (existingAttempt?.isCompleted) {
    throw new ApiError('You have already completed this quiz', 409);
  }
  if (existingAttempt) {
    // Resume existing attempt
    return res.status(200).json({
      success: true,
      message: 'Resuming attempt',
      data: { attemptId: existingAttempt._id, startedAt: existingAttempt.startedAt },
    });
  }

  const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
  quiz.attempts.push({ studentId: req.user._id, answers: [], totalMarks });
  await quiz.save();

  const newAttempt = quiz.attempts[quiz.attempts.length - 1];

  res.status(201).json({
    success: true,
    message: 'Quiz started',
    data: { attemptId: newAttempt._id, startedAt: newAttempt.startedAt, timeLimit: quiz.timeLimit },
  });
});

// ─── Submit Quiz Attempt ──────────────────────────────────────────────────────
exports.submitAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { answers } = req.body; // Array of { questionIndex, selectedOption }

  if (!Array.isArray(answers)) throw new ApiError('Answers must be an array', 400);

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError('Quiz not found', 404);

  const attempt = quiz.attempts.id(attemptId);
  if (!attempt) throw new ApiError('Attempt not found', 404);
  if (attempt.studentId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }
  if (attempt.isCompleted) throw new ApiError('Attempt already submitted', 409);

  // Validate time limit
  const elapsedMinutes = (Date.now() - new Date(attempt.startedAt)) / 60000;
  if (elapsedMinutes > quiz.timeLimit + 2) { // 2 min grace period
    throw new ApiError('Time limit exceeded', 400);
  }

  attempt.answers = answers;
  attempt.timeTaken = Math.round(elapsedMinutes * 60);

  const evaluated = quiz.evaluateAttempt(attemptId);
  await quiz.save();

  res.status(200).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      score: evaluated.score,
      totalMarks: evaluated.totalMarks,
      percentage: evaluated.percentage,
      grade: evaluated.grade,
      timeTaken: evaluated.timeTaken,
    },
  });
});

// ─── Update Quiz ──────────────────────────────────────────────────────────────
exports.updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError('Quiz not found', 404);
  if (quiz.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }
  if (quiz.attempts.some((a) => a.isCompleted)) {
    throw new ApiError('Cannot edit a quiz that has already been attempted', 400);
  }

  const allowed = ['title', 'description', 'questions', 'timeLimit', 'dueDate', 'shuffleQuestions', 'isPublished'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) quiz[f] = req.body[f]; });
  await quiz.save();

  res.status(200).json({ success: true, message: 'Quiz updated', data: { quiz } });
});

// ─── Delete Quiz ──────────────────────────────────────────────────────────────
exports.deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError('Quiz not found', 404);
  if (quiz.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError('Not authorized', 403);
  }

  await quiz.deleteOne();
  await CalendarEvent.deleteOne({ refId: quiz._id, refModel: 'Quiz' });

  res.status(200).json({ success: true, message: 'Quiz deleted' });
});
