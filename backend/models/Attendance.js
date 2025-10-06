const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    default: 'present'
  },
  method: {
    type: String,
    default: 'face_recognition'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  biometricData: {
    type: mongoose.Schema.Types.Mixed
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure one attendance record per student per day
attendanceSchema.index({ 
  student: 1, 
  date: 1 
}, { 
  unique: true,
  partialFilterExpression: {
    date: { $type: "date" }
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
