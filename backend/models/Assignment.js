const mongoose = require('mongoose');

// ─── Submission Sub-document ──────────────────────────────────────────────────
const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    files: [{
      originalName: String,
      filename: String,
      path: String,
      size: Number,
      mimetype: String,
    }],
    textContent: {
      type: String,
      maxlength: [50000, 'Text submission too long'],
    },
    marks: {
      type: Number,
      min: 0,
    },
    feedback: {
      type: String,
      maxlength: [2000],
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'late', 'returned'],
      default: 'submitted',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    plagiarismScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    plagiarismCheckedAt: Date,
  },
  { timestamps: true }
);

// ─── Assignment Model ─────────────────────────────────────────────────────────
const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
      maxlength: [5000],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
      default: 100,
    },
    allowedFileTypes: {
      type: [String],
      default: ['pdf', 'docx'],
    },
    attachments: [{
      originalName: String,
      filename: String,
      path: String,
      size: Number,
    }],
    submissions: [submissionSchema],
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

assignmentSchema.index({ courseId: 1, dueDate: 1 });
assignmentSchema.index({ teacherId: 1 });
assignmentSchema.index({ 'submissions.studentId': 1 });

assignmentSchema.virtual('submissionCount').get(function () {
  return this.submissions?.length || 0;
});

assignmentSchema.virtual('isOverdue').get(function () {
  return new Date() > new Date(this.dueDate);
});

// Check if a student has submitted
assignmentSchema.methods.getStudentSubmission = function (studentId) {
  return this.submissions.find(
    (s) => s.studentId.toString() === studentId.toString()
  );
};

module.exports = mongoose.model('Assignment', assignmentSchema);
