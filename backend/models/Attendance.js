const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true,
  },
});

const attendanceSchema = new mongoose.Schema(
  {
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
    date: {
      type: Date,
      required: true,
    },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

attendanceSchema.index({ courseId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ 'records.studentId': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
