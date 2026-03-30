const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: [200] },
    description: { type: String, maxlength: [1000] },
    type: {
      type: String,
      enum: ['assignment', 'quiz', 'class', 'exam', 'holiday', 'reminder', 'other'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    allDay: { type: Boolean, default: false },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    targetRole: { type: String, enum: ['all', 'student', 'teacher'] },
    color: { type: String, default: '#4f46e5' },
    refId: { type: mongoose.Schema.Types.ObjectId }, // Reference to assignment/quiz
    refModel: { type: String, enum: ['Assignment', 'Quiz'] },
  },
  { timestamps: true }
);

calendarEventSchema.index({ startDate: 1 });
calendarEventSchema.index({ courseId: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
