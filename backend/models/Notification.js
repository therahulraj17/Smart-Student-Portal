const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: [200] },
    message: { type: String, required: true, maxlength: [1000] },
    type: {
      type: String,
      enum: ['assignment', 'quiz', 'announcement', 'grade', 'reminder', 'chat', 'attendance'],
      required: true,
    },
    recipients: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      isRead: { type: Boolean, default: false },
      readAt: Date,
    }],
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    link: { type: String }, // Frontend route to navigate to
    isGlobal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ 'recipients.userId': 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
