const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [200, 'Course name cannot exceed 200 characters'],
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, 'Course code cannot exceed 20 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course must have a teacher'],
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    semester: {
      type: String,
      trim: true,
    },
    credits: {
      type: Number,
      min: 1,
      max: 10,
      default: 3,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    thumbnail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courseSchema.index({ teacher: 1 });

courseSchema.virtual('studentCount').get(function () {
  return this.students?.length || 0;
});

module.exports = mongoose.model('Course', courseSchema);
