const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    maxlength: [1000],
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length >= 2 && v.length <= 6,
      message: 'Options must be between 2 and 6',
    },
  },
  correctAnswer: {
    type: Number,
    required: true, // Index of correct option
  },
  marks: {
    type: Number,
    default: 1,
    min: 1,
  },
});

const attemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [{
      questionIndex: Number,
      selectedOption: Number, // -1 if skipped
    }],
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
    },
    grade: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    timeTaken: {
      type: Number, // in seconds
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [200],
    },
    description: {
      type: String,
      maxlength: [2000],
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
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (v) => v.length >= 1,
        message: 'Quiz must have at least one question',
      },
    },
    timeLimit: {
      type: Number, // minutes
      required: true,
      min: 1,
      max: 300,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    attempts: [attemptSchema],
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

quizSchema.index({ courseId: 1 });
quizSchema.index({ teacherId: 1 });
quizSchema.index({ 'attempts.studentId': 1 });

quizSchema.virtual('totalMarks').get(function () {
  return this.questions.reduce((sum, q) => sum + q.marks, 0);
});

quizSchema.virtual('questionCount').get(function () {
  return this.questions.length;
});

// Auto-evaluate quiz attempt
quizSchema.methods.evaluateAttempt = function (attemptId) {
  const attempt = this.attempts.id(attemptId);
  if (!attempt) return null;

  let score = 0;
  attempt.answers.forEach((answer) => {
    const question = this.questions[answer.questionIndex];
    if (question && answer.selectedOption === question.correctAnswer) {
      score += question.marks;
    }
  });

  const total = this.questions.reduce((sum, q) => sum + q.marks, 0);
  attempt.score = score;
  attempt.totalMarks = total;
  attempt.percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  attempt.grade = calculateGrade(attempt.percentage);
  attempt.isCompleted = true;
  attempt.submittedAt = new Date();

  return attempt;
};

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

module.exports = mongoose.model('Quiz', quizSchema);
