const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  batch: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  branch: {
    type: String,
    required: true,
    enum: ['Computer Engineering', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Electrical']
  },
  section: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D']
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  alternateNumber: {
    type: String
  },
  parentDetails: {
    fatherName: {
      type: String,
      required: true
    },
    motherName: {
      type: String,
      required: true
    },
    parentContact: {
      type: String,
      required: true
    },
    parentEmail: {
      type: String
    }
  },
  address: {
    current: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    permanent: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  academicDetails: {
    admissionDate: {
      type: Date,
      required: true
    },
    admissionType: {
      type: String,
      enum: ['Regular', 'Lateral Entry', 'Transfer'],
      default: 'Regular'
    },
    previousEducation: {
      schoolName: String,
      board: String,
      percentage: Number,
      yearOfPassing: Number
    }
  },
  enrolledClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  attendanceStats: {
    totalPresent: {
      type: Number,
      default: 0
    },
    totalClasses: {
      type: Number,
      default: 0
    },
    attendancePercentage: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate attendance percentage
studentSchema.methods.updateAttendanceStats = function() {
  if (this.attendanceStats.totalClasses > 0) {
    this.attendanceStats.attendancePercentage = 
      (this.attendanceStats.totalPresent / this.attendanceStats.totalClasses) * 100;
  }
  this.attendanceStats.lastUpdated = new Date();
};

module.exports = mongoose.model('Student', studentSchema);
