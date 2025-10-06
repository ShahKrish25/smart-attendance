const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');


const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs'); // Also needed for password hashing

// Middleware to ensure user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying admin privileges'
    });
  }
};

// GET /api/admin/students - Get all students with statistics
router.get('/students', auth, isAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching all students for admin dashboard...');

    // Get all student users
    const students = await User.find({ role: 'student' })
      .select('firstName lastName email studentId isActive faceRegistered lastLogin createdAt')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${students.length} students`);

    // Calculate statistics
    const stats = {
      total: students.length,
      registered: students.filter(s => s.faceRegistered).length,
      active: students.filter(s => s.isActive).length,
      inactive: students.filter(s => !s.isActive).length
    };

    console.log('📈 Stats calculated:', stats);

    res.json({
      success: true,
      students,
      stats,
      count: students.length
    });

  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students'
    });
  }
});

// GET /api/admin/students/:id - Get single student details
router.get('/students/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching student details for ID:', id);

    const student = await User.findById(id)
      .select('-password')
      .populate('studentProfile'); // If you have separate student profile

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'User is not a student'
      });
    }

    // Get attendance summary for this student
    const attendanceCount = await Attendance.countDocuments({
      student: id
    });

    // Get recent attendance
    const recentAttendance = await Attendance.find({
      student: id
    })
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      student: {
        ...student.toObject(),
        attendanceCount,
        recentAttendance
      }
    });

  } catch (error) {
    console.error('❌ Error fetching student details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student details'
    });
  }
});

// POST /api/admin/students - Create new student
router.post('/students', auth, isAdmin, async (req, res) => {
  try {
    console.log('➕ Creating new student:', req.body);

    const {
      firstName,
      lastName,
      email,
      password = 'student123', // Default password
      studentId,
      isActive = true
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !studentId) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and student ID are required'
      });
    }

    // Check if student ID already exists
    const existingStudentId = await User.findOne({ studentId });
    if (existingStudentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already exists'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create new student
    const student = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      studentId: studentId.trim(),
      role: 'student',
      isActive,
      faceRegistered: false
    });

    await student.save();

    console.log('✅ Student created successfully:', student._id);

    // Return student without password
    const studentResponse = await User.findById(student._id).select('-password');

    res.status(201).json({
      success: true,
      message: `Student ${firstName} ${lastName} created successfully`,
      student: studentResponse
    });

  } catch (error) {
    console.error('❌ Error creating student:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Student ID'} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating student'
    });
  }
});

// PUT /api/admin/students/:id - Update student
router.put('/students/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✏️ Updating student:', id, req.body);

    const {
      firstName,
      lastName,
      email,
      studentId,
      isActive
    } = req.body;

    // Find student
    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check for duplicate email (excluding current student)
    if (email && email !== student.email) {
      const existingEmail = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Check for duplicate student ID (excluding current student)
    if (studentId && studentId !== student.studentId) {
      const existingStudentId = await User.findOne({
        studentId,
        _id: { $ne: id }
      });
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    // Update student
    const updateData = {};
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (studentId) updateData.studentId = studentId.trim();
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedStudent = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: '-password' }
    );

    console.log('✅ Student updated successfully:', updatedStudent._id);

    res.json({
      success: true,
      message: 'Student updated successfully',
      student: updatedStudent
    });

  } catch (error) {
    console.error('❌ Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student'
    });
  }
});

// PATCH /api/admin/students/:id/status - Toggle student status
router.patch('/students/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    console.log(`🔄 Toggling student status: ${id} -> ${isActive}`);

    const student = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, select: '-password' }
    );

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log('✅ Student status updated:', student._id, isActive);

    res.json({
      success: true,
      message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`,
      student
    });

  } catch (error) {
    console.error('❌ Error updating student status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating student status'
    });
  }
});

// DELETE /api/admin/students/:id - Delete single student
router.delete('/students/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting student:', id);

    // Find and verify student exists
    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete related data first (attendance records, etc.)
    await Attendance.deleteMany({ student: id });
    console.log('🗑️ Deleted attendance records for student:', id);

    // Delete the student
    await User.findByIdAndDelete(id);
    console.log('✅ Student deleted successfully:', id);

    res.json({
      success: true,
      message: `Student ${student.firstName} ${student.lastName} deleted successfully`
    });

  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting student'
    });
  }
});

// POST /api/admin/students/bulk-delete - Delete multiple students
router.post('/students/bulk-delete', auth, isAdmin, async (req, res) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }

    console.log('🗑️ Bulk deleting students:', studentIds.length);

    // Verify all are students
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some selected users are not students'
      });
    }

    // Delete related data first
    await Attendance.deleteMany({ student: { $in: studentIds } });
    console.log('🗑️ Deleted attendance records for students:', studentIds.length);

    // Delete students
    const deleteResult = await User.deleteMany({
      _id: { $in: studentIds },
      role: 'student'
    });

    console.log('✅ Bulk delete completed:', deleteResult.deletedCount);

    res.json({
      success: true,
      message: `${deleteResult.deletedCount} students deleted successfully`,
      deletedCount: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('❌ Error bulk deleting students:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting students'
    });
  }
});



// GET /api/admin/instructors - Get all instructors/teachers
router.get('/instructors', auth, isAdmin, async (req, res) => {
  try {
    console.log('👨‍🏫 Loading instructors/teachers...');
    
    // Get users with instructor, teacher, OR admin role
    const instructors = await User.find({ 
      $or: [
        { role: 'instructor' },
        { role: 'teacher' },    // ✅ Add this line!
        { role: 'admin' }       // Fallback for admins
      ],
      isActive: true 
    }).select('firstName lastName email role');

    console.log('✅ Found instructors/teachers:', instructors.length);
    console.log('📋 Roles found:', instructors.map(i => i.role));

    res.json({
      success: true,
      instructors
    });
  } catch (error) {
    console.error('❌ Error loading instructors:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading instructors'
    });
  }
});







// POST /api/admin/instructors - Create new instructor
router.post('/instructors', [
  auth,
  isAdmin,
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, department } = req.body;

    // Check if instructor already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create instructor
    const instructor = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'instructor',
      department: department || 'General',
      isActive: true,
      emailVerified: true
    });

    await instructor.save();

    // Remove password from response
    const instructorResponse = instructor.toObject();
    delete instructorResponse.password;

    console.log('✅ Instructor created:', instructor.email);

    res.status(201).json({
      success: true,
      message: 'Instructor created successfully',
      instructor: instructorResponse
    });

  } catch (error) {
    console.error('❌ Error creating instructor:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating instructor'
    });
  }
});





// GET /api/admin/dashboard-stats - Get admin dashboard statistics
router.get('/dashboard-stats', auth, isAdmin, async (req, res) => {
  try {
    console.log('📊 Generating admin dashboard stats...');

    const [
      totalStudents,
      activeStudents,
      registeredFaces,
      todayAttendance
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'student', faceRegistered: true }),
      Attendance.countDocuments({
        createdAt: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      })
    ]);

    const stats = {
      students: {
        total: totalStudents,
        active: activeStudents,
        inactive: totalStudents - activeStudents,
        registered: registeredFaces,
        unregistered: totalStudents - registeredFaces
      },
      attendance: {
        today: todayAttendance,
        rate: totalStudents > 0 ? Math.round((todayAttendance / totalStudents) * 100) : 0
      }
    };

    console.log('✅ Dashboard stats generated:', stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error generating dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating dashboard statistics'
    });
  }
});

module.exports = router;
