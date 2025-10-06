const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'teacher'],
    default: 'student'
  },
  studentId: {
    type: String,
    sparse: true, // Only required for students
    unique: true
  },
  profileImage: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Face recognition data - FIXED VALIDATION
  faceDescriptor: {
    type: [Number],
    default: undefined, // Don't set empty array by default
    validate: {
      validator: function(v) {
        // Allow undefined/null or exactly 128 dimensions
        return !v || v.length === 128;
      },
      message: 'Face descriptor must have exactly 128 dimensions when provided'
    }
  },
  faceRegistered: {
    type: Boolean,
    default: false
  },
  // Additional biometric data for future features
  biometricData: {
    lastGender: {
      type: String,
      enum: ['male', 'female', 'unknown'],
      default: 'unknown'
    },
    lastEmotion: {
      type: String,
      enum: ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'],
      default: 'neutral'
    },
    lastAge: {
      type: Number,
      min: 0,
      max: 150
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1
    }
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate full name virtual
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
