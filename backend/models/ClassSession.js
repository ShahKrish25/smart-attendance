const mongoose = require('mongoose');

const classSessionSchema = new mongoose.Schema({
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionDate: {
    type: Date,
    required: true
  },
  scheduledStartTime: {
    type: String,  // "10:30"
    required: true
  },
  scheduledEndTime: {
    type: String,  // "12:00"
    required: true
  },
  actualStartTime: {
    type: Date
  },
  actualEndTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  sessionType: {
    type: String,
    enum: ['regular', 'makeup', 'extra', 'exam', 'lab'],
    default: 'regular'
  },
  room: {
    type: String,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  attendanceMarked: {
    type: Boolean,
    default: false
  },
  attendanceMethod: {
    type: String,
    enum: ['manual', 'face_recognition', 'qr_code'],
    default: 'face_recognition'
  },
  qrCode: {
    code: String,
    generatedAt: Date,
    expiresAt: Date
  },
  attendanceStats: {
    totalStudents: {
      type: Number,
      default: 0
    },
    presentStudents: {
      type: Number,
      default: 0
    },
    absentStudents: {
      type: Number,
      default: 0
    },
    attendanceRate: {
      type: Number,
      default: 0
    }
  },
  attendanceRecords: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present'
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['face_recognition', 'manual', 'qr_code'],
      default: 'face_recognition'
    },
    confidence: Number,
    location: {
      latitude: Number,
      longitude: Number
    }
  }],
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session duration
classSessionSchema.virtual('duration').get(function() {
  if (this.actualStartTime && this.actualEndTime) {
    return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for session day
classSessionSchema.virtual('dayOfWeek').get(function() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[this.sessionDate.getDay()];
});

// Virtual for is session active
classSessionSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual for is session live (within session time)
classSessionSchema.virtual('isLive').get(function() {
  const now = new Date();
  const sessionStart = new Date(this.sessionDate);
  const sessionEnd = new Date(this.sessionDate);
  
  // Set time based on scheduled times
  const [startHour, startMin] = this.scheduledStartTime.split(':');
  const [endHour, endMin] = this.scheduledEndTime.split(':');
  
  sessionStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
  sessionEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
  
  return now >= sessionStart && now <= sessionEnd;
});

// Indexes for efficient queries
classSessionSchema.index({ class: 1, sessionDate: 1 });
classSessionSchema.index({ instructor: 1, sessionDate: 1 });
classSessionSchema.index({ status: 1, sessionDate: 1 });
classSessionSchema.index({ sessionDate: 1, scheduledStartTime: 1 });

// Methods
classSessionSchema.methods.startSession = function() {
  this.status = 'active';
  this.actualStartTime = new Date();
  return this.save();
};

classSessionSchema.methods.endSession = function() {
  this.status = 'completed';
  this.actualEndTime = new Date();
  this.calculateAttendanceStats();
  return this.save();
};

// classSessionSchema.methods.calculateAttendanceStats = function() {
//   const totalStudents = this.attendanceRecords.length;
//   const presentStudents = this.attendanceRecords.filter(record => 
//     record.status === 'present' || record.status === 'late'
//   ).length;
//   const absentStudents = totalStudents - presentStudents;
//   const attendanceRate = totalStudents > 0 ? Math.round((presentStudents / totalStudents) * 100) : 0;

//   this.attendanceStats = {
//     totalStudents,
//     presentStudents,
//     absentStudents,
//     attendanceRate
//   };
// };




classSessionSchema.methods.calculateAttendanceStats = function() {
  const totalStudents = this.class?.students?.length || 0;
  const presentStudents = this.attendanceRecords.filter(record => 
    record.status === 'present' || record.status === 'late'
  ).length;
  
  // Get unique students only (prevent duplicates in calculation)
  const uniqueAttendedStudents = new Set();
  this.attendanceRecords.forEach(record => {
    if (record.status === 'present' || record.status === 'late') {
      uniqueAttendedStudents.add(record.student.toString());
    }
  });
  
  const uniquePresentCount = uniqueAttendedStudents.size;
  const attendanceRate = totalStudents > 0 ? Math.round((uniquePresentCount / totalStudents) * 100) : 0;

  this.attendanceStats = {
    totalStudents: totalStudents,
    presentStudents: uniquePresentCount,
    absentStudents: totalStudents - uniquePresentCount,
    attendanceRate: attendanceRate
  };

  console.log('📊 Attendance stats calculated:', {
    total: totalStudents,
    present: uniquePresentCount,
    rate: attendanceRate
  });
};









// classSessionSchema.methods.markAttendance = function(studentId, status = 'present', method = 'face_recognition', confidence = null) {
//   // Remove existing record for this student
//   this.attendanceRecords = this.attendanceRecords.filter(record => 
//     !record.student.equals(studentId)
//   );

//   // Add new record
//   this.attendanceRecords.push({
//     student: studentId,
//     status,
//     method,
//     confidence,
//     markedAt: new Date()
//   });

//   this.attendanceMarked = true;
//   this.calculateAttendanceStats();
//   return this.save();
// };


classSessionSchema.methods.markAttendance = function(studentId, status = 'present', method = 'manual', confidence = null) {
  try {
    // Check if attendance already exists for this student in this session
    const existingIndex = this.attendanceRecords.findIndex(record => 
      record.student.toString() === studentId.toString()
    );

    if (existingIndex !== -1) {
      // Update existing record instead of creating duplicate
      console.log('⚠️ Updating existing attendance record for student:', studentId);
      this.attendanceRecords[existingIndex] = {
        student: studentId,
        status: status,
        markedAt: new Date(),
        method: method,
        confidence: confidence
      };
    } else {
      // Create new attendance record
      console.log('✅ Creating new attendance record for student:', studentId);
      this.attendanceRecords.push({
        student: studentId,
        status: status,
        markedAt: new Date(),
        method: method,
        confidence: confidence
      });
    }

    // Recalculate attendance statistics
    this.calculateAttendanceStats();
    
    return this.save();
  } catch (error) {
    console.error('❌ Error marking attendance:', error);
    throw error;
  }
};



classSessionSchema.methods.generateQRCode = function(expirationMinutes = 60) {
  const qrCode = {
    code: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000)
  };
  
  this.qrCode = qrCode;
  return this.save();
};

// Static methods
classSessionSchema.statics.getScheduleForDate = function(date, classId = null) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    sessionDate: { $gte: startOfDay, $lte: endOfDay }
  };

  if (classId) {
    query.class = classId;
  }

  return this.find(query)
    .populate('class', 'name code subject')
    .populate('instructor', 'firstName lastName')
    .sort({ scheduledStartTime: 1 });
};

classSessionSchema.statics.getActiveSession = function(classId) {
  return this.findOne({
    class: classId,
    status: 'active'
  }).populate('class').populate('instructor');
};

module.exports = mongoose.model('ClassSession', classSessionSchema);
