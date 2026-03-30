const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'note', 'other'],
      required: true,
    },
    file: {
      originalName: String,
      filename: String,
      path: String,
      size: Number,
      mimetype: String,
    },
    externalUrl: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL'],
    },
    tags: [String],
    downloadCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

materialSchema.index({ courseId: 1 });
materialSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Material', materialSchema);
