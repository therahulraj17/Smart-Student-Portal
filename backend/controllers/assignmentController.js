const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const CalendarEvent = require('../models/CalendarEvent');
const { ApiError, asyncHandler } = require('../middleware/errorMiddleware');
const { compareSubmissions, getRiskLevel } = require('../utils/plagiarismChecker');
const { emitToUser } = require('../config/socket');

// ─── Teacher: Create Assignment ───────────────────────────────────────────────
exports.createAssignment = asyncHandler(async (req, res) => {
  const { title, description, courseId, dueDate, totalMarks, allowedFileTypes } = req.body;

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.teacher.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to create assignments for this course', 403);
  }

  const attachments = req.files?.map((f) => ({
    originalName: f.originalname,
    filename: f.filename,
    path: f.path,
    size: f.size,
  })) || [];

  const assignment = await Assignment.create({
    title, description, courseId, teacherId: req.user._id,
    dueDate, totalMarks, allowedFileTypes, attachments,
  });

  // Create calendar event for deadline
  await CalendarEvent.create({
    title: `Assignment Due: ${title}`,
    type: 'assignment',
    startDate: dueDate,
    courseId,
    createdBy: req.user._id,
    targetRole: 'student',
    color: '#ef4444',
    refId: assignment._id,
    refModel: 'Assignment',
  });

  // Notify enrolled students
  const students = course.students;
  if (students.length > 0) {
    const notification = await Notification.create({
      title: 'New Assignment Posted',
      message: `${title} has been posted in ${course.name}. Due: ${new Date(dueDate).toLocaleDateString()}`,
      type: 'assignment',
      recipients: students.map((s) => ({ userId: s })),
      sender: req.user._id,
      courseId,
      link: `/assignments/${assignment._id}`,
    });

    // Real-time notification
    students.forEach((studentId) => {
      emitToUser(studentId, 'notification', {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
      });
    });
  }

  res.status(201).json({ success: true, message: 'Assignment created', data: { assignment } });
});

// ─── Get Assignments (role-aware) ────────────────────────────────────────────
exports.getAssignments = asyncHandler(async (req, res) => {
  const { courseId, status } = req.query;
  let query = {};

  if (req.user.role === 'teacher') {
    query.teacherId = req.user._id;
  } else if (req.user.role === 'student') {
    const enrolledCourses = req.user.enrolledCourses;
    query.courseId = { $in: enrolledCourses };
    query.isPublished = true;
  }

  if (courseId) query.courseId = courseId;

  const assignments = await Assignment.find(query)
    .populate('courseId', 'name code')
    .populate('teacherId', 'name')
    .sort({ dueDate: 1 })
    .lean();

  // For students, mark submission status
  if (req.user.role === 'student') {
    assignments.forEach((a) => {
      const sub = a.submissions?.find(
        (s) => s.studentId?.toString() === req.user._id.toString()
      );
      a.mySubmission = sub ? {
        status: sub.status,
        submittedAt: sub.submittedAt,
        marks: sub.marks,
        feedback: sub.feedback,
        isLate: sub.isLate,
      } : null;
      delete a.submissions; // Don't expose all submissions to student
    });
  }

  res.status(200).json({ success: true, data: { assignments, count: assignments.length } });
});

// ─── Get Single Assignment ────────────────────────────────────────────────────
exports.getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('courseId', 'name code')
    .populate('teacherId', 'name email')
    .populate('submissions.studentId', 'name email studentId');

  if (!assignment) throw new ApiError('Assignment not found', 404);

  // Students only see their own submission
  if (req.user.role === 'student') {
    const mySub = assignment.submissions.find(
      (s) => s.studentId?._id.toString() === req.user._id.toString()
    );
    return res.status(200).json({
      success: true,
      data: { assignment: { ...assignment.toJSON(), submissions: undefined, mySubmission: mySub || null } },
    });
  }

  res.status(200).json({ success: true, data: { assignment } });
});

// ─── Update Assignment ────────────────────────────────────────────────────────
exports.updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new ApiError('Assignment not found', 404);
  if (assignment.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to update this assignment', 403);
  }

  const allowed = ['title', 'description', 'dueDate', 'totalMarks', 'allowedFileTypes', 'isPublished'];
  allowed.forEach((f) => { if (req.body[f] !== undefined) assignment[f] = req.body[f]; });
  await assignment.save();

  res.status(200).json({ success: true, message: 'Assignment updated', data: { assignment } });
});

// ─── Delete Assignment ────────────────────────────────────────────────────────
exports.deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new ApiError('Assignment not found', 404);
  if (assignment.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError('Not authorized', 403);
  }

  await assignment.deleteOne();
  await CalendarEvent.deleteOne({ refId: assignment._id, refModel: 'Assignment' });

  res.status(200).json({ success: true, message: 'Assignment deleted' });
});

// ─── Student: Submit Assignment ───────────────────────────────────────────────
exports.submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw new ApiError('Assignment not found', 404);

  const alreadySubmitted = assignment.getStudentSubmission(req.user._id);
  if (alreadySubmitted) throw new ApiError('Already submitted. Contact teacher to resubmit.', 409);

  const files = req.files?.map((f) => ({
    originalName: f.originalname,
    filename: f.filename,
    path: f.path,
    size: f.size,
    mimetype: f.mimetype,
  })) || [];

  if (files.length === 0 && !req.body.textContent) {
    throw new ApiError('Submit a file or text content', 400);
  }

  const isLate = new Date() > new Date(assignment.dueDate);

  assignment.submissions.push({
    studentId: req.user._id,
    files,
    textContent: req.body.textContent,
    status: isLate ? 'late' : 'submitted',
    isLate,
  });

  await assignment.save();

  // Notify teacher
  emitToUser(assignment.teacherId, 'notification', {
    title: 'New Submission',
    message: `${req.user.name} submitted "${assignment.title}"${isLate ? ' (late)' : ''}`,
    type: 'assignment',
  });

  res.status(201).json({
    success: true,
    message: `Assignment submitted successfully${isLate ? ' (marked as late)' : ''}`,
  });
});

// ─── Teacher: Grade Submission ────────────────────────────────────────────────
exports.gradeSubmission = asyncHandler(async (req, res) => {
  const { marks, feedback } = req.body;
  const { id: assignmentId, submissionId } = req.params;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ApiError('Assignment not found', 404);
  if (assignment.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  if (marks > assignment.totalMarks) {
    throw new ApiError(`Marks cannot exceed total marks (${assignment.totalMarks})`, 400);
  }

  const submission = assignment.submissions.id(submissionId);
  if (!submission) throw new ApiError('Submission not found', 404);

  submission.marks = marks;
  submission.feedback = feedback;
  submission.status = 'graded';
  await assignment.save();

  // Notify student
  const studentId = submission.studentId;
  emitToUser(studentId, 'notification', {
    title: 'Assignment Graded',
    message: `Your submission for "${assignment.title}" has been graded: ${marks}/${assignment.totalMarks}`,
    type: 'grade',
  });

  res.status(200).json({ success: true, message: 'Submission graded', data: { submission } });
});

// ─── Plagiarism Check ─────────────────────────────────────────────────────────
exports.checkPlagiarism = asyncHandler(async (req, res) => {
  const { id: assignmentId, submissionId } = req.params;

  const assignment = await Assignment.findById(assignmentId)
    .populate('submissions.studentId', 'name');
  if (!assignment) throw new ApiError('Assignment not found', 404);
  if (assignment.teacherId.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const targetSubmission = assignment.submissions.id(submissionId);
  if (!targetSubmission) throw new ApiError('Submission not found', 404);
  if (!targetSubmission.textContent) {
    throw new ApiError('Plagiarism check only available for text submissions', 400);
  }

  const otherSubmissions = assignment.submissions.filter(
    (s) => s._id.toString() !== submissionId && s.textContent
  );

  const results = compareSubmissions(targetSubmission.textContent, otherSubmissions);

  const maxSimilarity = results.length > 0 ? results[0].similarity : 0;
  targetSubmission.plagiarismScore = maxSimilarity;
  targetSubmission.plagiarismCheckedAt = new Date();
  await assignment.save();

  res.status(200).json({
    success: true,
    data: {
      score: maxSimilarity,
      riskLevel: getRiskLevel(maxSimilarity),
      matches: results,
    },
  });
});
