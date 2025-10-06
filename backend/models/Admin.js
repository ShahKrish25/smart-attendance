const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  permissions: {
    canManageStudents: {
      type: Boolean,
      default: true
    },
    canManageClasses: {
      type: Boolean,
      default: true
    },
    canViewReports: {
      type: Boolean,
      default: true
    },
    canManageAttendance: {
      type: Boolean,
      default: true
    },
    canManageSystem: {
      type: Boolean,
      default: false // Super admin only
    }
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    enum: ['Principal', 'Vice Principal', 'HOD', 'Coordinator', 'Admin Assistant'],
    default: 'Admin Assistant'
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  isSuper: {
    type: Boolean,
    default: false // Super admin can manage other admins
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Admin', adminSchema);
