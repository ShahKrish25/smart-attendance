const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 200
  },
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: {
      type: String,
      trim: true
    }
  },
  semester: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  credits: {
    type: Number,
    min: 1,
    max: 10,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentOpen: {
    type: Boolean,
    default: true
  },
  attendanceRequired: {
    type: Boolean,
    default: true
  },
  minimumAttendance: {
    type: Number,
    min: 0,
    max: 100,
    default: 75 // Percentage
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    totalSessions: {
      type: Number,
      default: 0
    },
    completedSessions: {
      type: Number,
      default: 0
    },
    averageAttendance: {
      type: Number,
      default: 0
    },
    lastSessionDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for enrollment count
classSchema.virtual('enrollmentCount').get(function() {
  return this.students ? this.students.length : 0;
});

// Virtual for availability
classSchema.virtual('availableSlots').get(function() {
  return this.capacity - (this.students ? this.students.length : 0);
});

// Virtual for enrollment status
classSchema.virtual('enrollmentStatus').get(function() {
  const enrolled = this.students ? this.students.length : 0;
  if (enrolled >= this.capacity) return 'full';
  if (enrolled >= this.capacity * 0.8) return 'almost_full';
  return 'available';
});

// Index for efficient queries
classSchema.index({ code: 1 });
classSchema.index({ instructor: 1 });
classSchema.index({ department: 1, academicYear: 1 });
classSchema.index({ isActive: 1, enrollmentOpen: 1 });

// Methods
classSchema.methods.addStudent = function(studentId) {
  if (!this.students.includes(studentId) && this.students.length < this.capacity) {
    this.students.push(studentId);
    return true;
  }
  return false;
};

classSchema.methods.removeStudent = function(studentId) {
  this.students = this.students.filter(id => !id.equals(studentId));
  return this;
};

classSchema.methods.updateAttendanceStats = async function() {
  const Attendance = mongoose.model('Attendance');
  
  // Get all attendance records for this class
  const attendanceRecords = await Attendance.find({
    classId: this._id
  });

  // Calculate statistics
  const totalSessions = [...new Set(attendanceRecords.map(record => 
    record.createdAt.toDateString()
  ))].length;

  const averageAttendance = this.students.length > 0 && totalSessions > 0
    ? Math.round((attendanceRecords.length / (this.students.length * totalSessions)) * 100)
    : 0;

  this.metadata.totalSessions = totalSessions;
  this.metadata.averageAttendance = averageAttendance;
  this.metadata.lastSessionDate = attendanceRecords.length > 0 
    ? new Date(Math.max(...attendanceRecords.map(r => r.createdAt)))
    : null;

  return this.save();
};

module.exports = mongoose.model('Class', classSchema);
