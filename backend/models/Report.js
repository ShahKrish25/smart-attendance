const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['attendance', 'student_performance', 'class_summary', 'monthly', 'custom'],
    required: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  filters: {
    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }],
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    branches: [String],
    semesters: [Number]
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Store report data
    required: true
  },
  summary: {
    totalStudents: Number,
    totalClasses: Number,
    averageAttendance: Number,
    highestAttendance: Number,
    lowestAttendance: Number
  },
  fileUrl: {
    type: String // URL to generated PDF/Excel file
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
