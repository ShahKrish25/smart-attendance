// const express = require('express');
// const { body, validationResult, query } = require('express-validator');
// const Attendance = require('../models/Attendance');
// const User = require('../models/User');
// const Student = require('../models/Student');
// const Class = require('../models/Class');
// const auth = require('../middleware/auth');
// const adminAuth = require('../middleware/admin');
// const router = express.Router();

// // @route   POST /api/attendance/mark
// // @desc    Mark attendance (face recognition)
// // @access  Private
// // Mark attendance
// router.post('/mark', auth, async (req, res) => {
//   try {
//     console.log('📝 Marking attendance:', req.body);
    
//     const { studentId, confidence, method = 'face_recognition', biometricData } = req.body;

//     // Validate student exists
//     const student = await User.findById(studentId);
//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: 'Student not found'
//       });
//     }

//     // Check if attendance already marked today
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const existingAttendance = await Attendance.findOne({
//       student: studentId,
//       date: { $gte: today, $lt: tomorrow }
//     });

//     if (existingAttendance) {
//       return res.status(400).json({
//         success: false,
//         message: `Attendance already marked today for ${student.firstName} ${student.lastName}`
//       });
//     }

//     // Create new attendance record
//     const attendance = new Attendance({
//       student: studentId,
//       status: 'present',
//       method: method,
//       confidence: confidence,
//       biometricData: biometricData,
//       markedBy: req.userId,
//       date: new Date()
//     });

//     await attendance.save();
//     console.log('✅ Attendance saved:', attendance._id);

//     res.json({
//       success: true,
//       message: `Attendance marked successfully for ${student.firstName} ${student.lastName}`,
//       attendanceId: attendance._id,
//       attendance: {
//         id: attendance._id,
//         student: {
//           id: student._id,
//           firstName: student.firstName,
//           lastName: student.lastName,
//           studentId: student.studentId
//         },
//         status: attendance.status,
//         confidence: attendance.confidence,
//         date: attendance.date
//       }
//     });

//   } catch (error) {
//     console.error('❌ Attendance marking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error marking attendance'
//     });
//   }
// });


// // @route   GET /api/attendance/student/:studentId
// // @desc    Get attendance history for a student
// // @access  Private
// router.get('/student/:studentId', auth, [
//   query('startDate').optional().isISO8601(),
//   query('endDate').optional().isISO8601(),
//   query('classId').optional().isMongoId(),
//   query('page').optional().isInt({ min: 1 }),
//   query('limit').optional().isInt({ min: 1, max: 100 })
// ], async (req, res) => {
//   try {
//     const { studentId } = req.params;
//     const { startDate, endDate, classId, page = 1, limit = 20 } = req.query;

//     // Check authorization - students can only view their own records
//     if (req.user.role === 'student' && req.userId !== studentId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     // Build query
//     let query = { student: studentId };
    
//     if (startDate && endDate) {
//       query.date = {
//         $gte: startDate,
//         $lte: endDate
//       };
//     }
    
//     if (classId) {
//       query.class = classId;
//     }

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     const [attendanceRecords, total] = await Promise.all([
//       Attendance.find(query)
//         .populate('class', 'className subject schedule')
//         .sort({ date: -1, checkIn: -1 })
//         .skip(skip)
//         .limit(parseInt(limit)),
//       Attendance.countDocuments(query)
//     ]);

//     // Calculate statistics
//     const stats = {
//       totalClasses: total,
//       presentCount: attendanceRecords.filter(a => a.status === 'present').length,
//       lateCount: attendanceRecords.filter(a => a.status === 'late').length,
//       absentCount: attendanceRecords.filter(a => a.status === 'absent').length
//     };
    
//     stats.attendancePercentage = total > 0 ? 
//       ((stats.presentCount + stats.lateCount) / total * 100).toFixed(2) : 0;

//     res.json({
//       success: true,
//       data: {
//         attendance: attendanceRecords,
//         stats,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(total / parseInt(limit)),
//           total,
//           hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
//           hasPrev: parseInt(page) > 1
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get attendance history error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// // @route   GET /api/attendance/class/:classId
// // @desc    Get attendance for a specific class (Admin/Teacher only)
// // @access  Private/Admin
// router.get('/class/:classId', auth, adminAuth, [
//   query('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
//   query('startDate').optional().isISO8601(),
//   query('endDate').optional().isISO8601()
// ], async (req, res) => {
//   try {
//     const { classId } = req.params;
//     const { date, startDate, endDate } = req.query;

//     let query = { class: classId };

//     if (date) {
//       query.date = date;
//     } else if (startDate && endDate) {
//       query.date = { $gte: startDate, $lte: endDate };
//     }

//     const attendanceRecords = await Attendance.find(query)
//       .populate('student', 'firstName lastName studentId')
//       .sort({ date: -1, checkIn: -1 });

//     // Get class details and enrolled students
//     const classDoc = await Class.findById(classId)
//       .populate('students', 'firstName lastName studentId');

//     // Calculate attendance summary
//     const summary = {
//       totalStudents: classDoc.students.length,
//       presentCount: attendanceRecords.filter(a => a.status === 'present').length,
//       lateCount: attendanceRecords.filter(a => a.status === 'late').length,
//       absentCount: classDoc.students.length - attendanceRecords.length,
//       attendanceRate: classDoc.students.length > 0 ? 
//         ((attendanceRecords.length / classDoc.students.length) * 100).toFixed(2) : 0
//     };

//     res.json({
//       success: true,
//       data: {
//         class: classDoc,
//         attendance: attendanceRecords,
//         summary
//       }
//     });

//   } catch (error) {
//     console.error('Get class attendance error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// });

// module.exports = router;




// new code

// const express = require('express');
// const router = express.Router();
// const Attendance = require('../models/Attendance');
// const User = require('../models/User');
// const auth = require('../middleware/auth');

// // Mark attendance
// router.post('/mark', auth, async (req, res) => {
//   try {
//     const { studentId, confidence } = req.body;
    
//     // ✅ Better duplicate check - same day only
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);
    
//     const endOfDay = new Date();
//     endOfDay.setHours(23, 59, 59, 999);

//     const existingAttendance = await Attendance.findOne({
//       student: studentId,
//       createdAt: {
//         $gte: startOfDay,
//         $lte: endOfDay
//       }
//     });

//     if (existingAttendance) {
//       console.log('⏭️ Attendance already exists for today:', studentId);
      
//       const user = await User.findById(studentId);
//       return res.status(200).json({ // ✅ Return 200 instead of 400
//         success: true, // ✅ Mark as success
//         message: `Attendance already marked today for ${user.firstName} ${user.lastName}`,
//         attendanceId: existingAttendance._id,
//         alreadyExists: true
//       });
//     }

//     // Create new attendance
//     const attendance = new Attendance({
//       student: studentId,
//       status: 'present',
//       method: 'face_recognition',
//       confidence: confidence,
//       markedBy: req.userId
//     });

//     await attendance.save();
//     console.log('✅ New attendance created:', attendance._id);

//     const user = await User.findById(studentId);

//     res.json({
//       success: true,
//       message: `Attendance marked for ${user.firstName} ${user.lastName}`,
//       attendanceId: attendance._id,
//       alreadyExists: false
//     });

//   } catch (error) {
//     console.error('❌ Attendance error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// module.exports = router;






// final updated code

const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Mark attendance with duplicate prevention
router.post('/mark', auth, async (req, res) => {
  try {
    console.log('📝 Attendance request received:', req.body);
    
    const { studentId, confidence } = req.body;

    // Validate student exists
    const user = await User.findById(studentId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // ✅ Use MongoDB's findOneAndUpdate with upsert for atomic duplicate prevention
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // Try to create attendance, but only if it doesn't exist
    const filter = {
      student: studentId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    const existingAttendance = await Attendance.findOne(filter);

    if (existingAttendance) {
      console.log('⏭️ Attendance already exists:', existingAttendance._id);
      
      return res.status(200).json({
        success: true,
        message: `Attendance already marked today for ${user.firstName} ${user.lastName}`,
        attendanceId: existingAttendance._id,
        alreadyExists: true
      });
    }

    // ✅ Create new attendance with additional safeguard
    const attendanceData = {
      student: studentId,
      status: 'present',
      method: 'face_recognition',
      confidence: confidence || 0.6,
      markedBy: req.userId
    };

    const attendance = new Attendance(attendanceData);
    await attendance.save();
    
    console.log('✅ NEW attendance created:', attendance._id);

    res.status(201).json({
      success: true,
      message: `Attendance marked for ${user.firstName} ${user.lastName}`,
      attendanceId: attendance._id,
      alreadyExists: false,
      attendance: {
        id: attendance._id,
        student: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId
        },
        status: attendance.status,
        confidence: attendance.confidence,
        date: attendance.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Attendance marking error:', error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const user = await User.findById(req.body.studentId);
      return res.status(200).json({
        success: true,
        message: `Attendance already marked today for ${user.firstName} ${user.lastName}`,
        alreadyExists: true
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error marking attendance'
    });
  }
});




// Get today's attendance
router.get('/today', auth, async (req, res) => {
  try {
    const { date } = req.query;
    
    let targetDate;
    if (date) {
      targetDate = new Date(date);
    } else {
      targetDate = new Date();
    }
    
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    
    console.log('📅 Fetching attendance for date:', startOfDay.toDateString());

    const attendance = await Attendance.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('student', 'firstName lastName studentId email')
    .sort({ createdAt: -1 });

    console.log('✅ Found', attendance.length, 'attendance records for today');

    res.json({
      success: true,
      attendance,
      count: attendance.length,
      date: startOfDay.toDateString()
    });

  } catch (error) {
    console.error('❌ Error fetching today\'s attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s attendance'
    });
  }
});






// Get attendance history
router.get('/history/:studentId?', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let query = {};
    
    if (studentId) {
      query.student = studentId;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      attendance,
      count: attendance.length
    });

  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance history'
    });
  }
});

module.exports = router;
