const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');
const router = express.Router();

// @route   GET /api/students
// @desc    Get all students (Admin only)
// @access  Private/Admin
router.get('/', auth, adminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('branch').optional().trim(),
  query('semester').optional().isInt({ min: 1, max: 8 }),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    let userFilter = { role: 'student', isActive: true };
    let studentFilter = {};

    if (req.query.search) {
      userFilter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { studentId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.branch) {
      studentFilter.branch = req.query.branch;
    }

    if (req.query.semester) {
      studentFilter.semester = parseInt(req.query.semester);
    }

    // Get students with user data
    const students = await Student.find(studentFilter)
      .populate({
        path: 'user',
        match: userFilter,
        select: '-password'
      })
      .populate('enrolledClasses', 'className subject')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Filter out students where user match failed
    const filteredStudents = students.filter(student => student.user);

    const total = await Student.countDocuments(studentFilter);

    res.json({
      success: true,
      data: {
        students: filteredStudents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalStudents: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/students/register-face
// @desc    Register student's face descriptor
// @access  Private
// Add this route to your existing students.js file
// router.post('/register-face', auth, async (req, res) => {
//   try {
//     const { faceDescriptor, biometricData } = req.body;

//     // Validate face descriptor
//     if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid face descriptor. Must be an array of 128 numbers.'
//       });
//     }

//     // Update user with face data
//     const user = await User.findById(req.userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Update user face data
//     user.faceDescriptor = faceDescriptor;
//     user.faceRegistered = true;
//     if (biometricData) {
//       user.biometricData = {
//         ...user.biometricData,
//         ...biometricData
//       };
//     }

//     await user.save();

//     res.json({
//       success: true,
//       message: 'Face registered successfully',
//       user: {
//         id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         role: user.role,
//         faceRegistered: user.faceRegistered
//       }
//     });

//   } catch (error) {
//     console.error('Face registration error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error registering face data'
//     });
//   }
// });



// new code for register to handle the re-register face
// Update the register-face route to handle re-registration
router.post('/register-face', auth, async (req, res) => {
  try {
    const { faceDescriptor, biometricData, isReRegistration = false } = req.body;

    // Validate face descriptor
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        message: 'Invalid face descriptor. Must be an array of 128 numbers.'
      });
    }

    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log the registration type
    console.log(`${isReRegistration ? 'Re-registering' : 'Registering'} face for user:`, user.email);

    // Update user face data (works for both new registration and re-registration)
    user.faceDescriptor = faceDescriptor;
    user.faceRegistered = true;
    
    if (biometricData) {
      user.biometricData = {
        ...user.biometricData,
        ...biometricData,
        lastUpdated: new Date()
      };
    }

    await user.save();

    const message = isReRegistration 
      ? 'Face re-registered successfully' 
      : 'Face registered successfully';

    console.log('✅', message, 'for user:', user.email);

    res.json({
      success: true,
      message,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        faceRegistered: user.faceRegistered,
        isReRegistration
      }
    });

  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing face registration'
    });
  }
});





// @route   GET /api/students/profile
// @desc    Get student profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let studentDetails = null;
    if (user.role === 'student') {
      studentDetails = await Student.findOne({ user: user._id })
        .populate('enrolledClasses', 'className subject schedule');
    }

    res.json({
      success: true,
      data: {
        user,
        studentDetails
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/students/enroll-class
// @desc    Enroll student in a class
// @access  Private/Admin
router.post('/enroll-class', auth, adminAuth, [
  body('studentId').isMongoId().withMessage('Valid student ID required'),
  body('classId').isMongoId().withMessage('Valid class ID required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { studentId, classId } = req.body;

    // Find student and class
    const student = await Student.findById(studentId);
    const classDoc = await Class.findById(classId);

    if (!student || !classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Student or class not found'
      });
    }

    // Check if already enrolled
    if (student.enrolledClasses.includes(classId)) {
      return res.status(400).json({
        success: false,
        message: 'Student already enrolled in this class'
      });
    }

    // Enroll student
    student.enrolledClasses.push(classId);
    classDoc.students.push(student.user);

    await Promise.all([student.save(), classDoc.save()]);

    res.json({
      success: true,
      message: 'Student enrolled successfully'
    });

  } catch (error) {
    console.error('Enroll class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all registered faces for recognition
// Get all registered faces for recognition
router.get('/registered-faces', auth, async (req, res) => {
  try {
    console.log('🔍 Fetching registered faces...');
    
    const users = await User.find({ 
      faceRegistered: true,
      faceDescriptor: { $exists: true, $ne: [] }
    }).select('firstName lastName email studentId faceDescriptor');

    console.log(`📋 Found ${users.length} registered users`);

    const registeredFaces = users.map(user => ({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        studentId: user.studentId
      },
      descriptor: user.faceDescriptor
    }));

    res.json({
      success: true,
      registeredFaces,
      count: registeredFaces.length
    });

  } catch (error) {
    console.error('❌ Error fetching registered faces:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registered faces'
    });
  }
});



// Mark attendance
router.post('/mark', auth, async (req, res) => {
  try {
    const { studentId, confidence, method = 'face_recognition', biometricData } = req.body;

    // Check if attendance already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      student: studentId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked today'
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      student: studentId,
      status: 'present',
      method: method,
      confidence: confidence,
      biometricData: biometricData,
      markedBy: req.userId,
      date: new Date()
    });

    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      attendanceId: attendance._id,
      attendance
    });

  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance'
    });
  }
});






module.exports = router;
