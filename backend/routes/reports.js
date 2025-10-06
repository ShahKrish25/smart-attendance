const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');

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
    console.error('Admin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying admin privileges'
    });
  }
};

// GET /api/admin/reports/attendance - Get attendance analytics
router.get('/attendance', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('📊 Reports route hit with params:', req.query);
    console.log('📊 User ID:', req.userId);
    
    if (!startDate || !endDate) {
      console.log('❌ Missing date parameters:', { startDate, endDate });
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    console.log('📊 Generating attendance report:', startDate, 'to', endDate);

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all active students
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    console.log('👥 Total students:', totalStudents);

    // Get attendance records in date range
    const attendanceRecords = await Attendance.find({
      createdAt: { $gte: start, $lte: end }
    })
    .populate('student', 'firstName lastName email studentId')
    .sort({ createdAt: -1 });

    console.log('📝 Found attendance records:', attendanceRecords.length);

    // Calculate summary statistics
    const totalPresentDays = attendanceRecords.length;
    const uniqueDates = [...new Set(attendanceRecords.map(record => 
      record.createdAt.toISOString().split('T')[0]
    ))];
    
    console.log('📅 Unique dates:', uniqueDates);

    const totalPossibleDays = uniqueDates.length * totalStudents;
    const totalAbsentDays = Math.max(0, totalPossibleDays - totalPresentDays);
    const averageAttendance = totalPossibleDays > 0 
      ? Math.round((totalPresentDays / totalPossibleDays) * 100) 
      : 0;

    // Daily statistics
    const dailyStats = [];
    for (const date of uniqueDates.sort()) {
      const dayAttendance = attendanceRecords.filter(record => {
        const recordDate = record.createdAt.toISOString().split('T')[0];
        return recordDate === date;
      });

      const presentCount = dayAttendance.length;
      const absentCount = Math.max(0, totalStudents - presentCount);
      const attendanceRate = totalStudents > 0 
        ? Math.round((presentCount / totalStudents) * 100) 
        : 0;

      dailyStats.push({
        date,
        presentCount,
        absentCount,
        totalStudents,
        attendanceRate
      });
    }

    // Student statistics
    const students = await User.find({ role: 'student', isActive: true })
      .select('firstName lastName email studentId');

    const studentStats = [];
    for (const student of students) {
      const studentAttendance = attendanceRecords.filter(record => 
        record.student && record.student._id.toString() === student._id.toString()
      );

      const presentDays = studentAttendance.length;
      const totalDays = uniqueDates.length;
      const attendanceRate = totalDays > 0 
        ? Math.round((presentDays / totalDays) * 100) 
        : 0;

      studentStats.push({
        studentId: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        studentNumber: student.studentId,
        presentDays,
        totalDays,
        attendanceRate
      });
    }

    // Sort by attendance rate
    studentStats.sort((a, b) => b.attendanceRate - a.attendanceRate);

    const reportData = {
      summary: {
        totalStudents,
        totalPresentDays,
        totalPossibleDays,
        totalAbsentDays,
        averageAttendance,
        dateRange: { startDate, endDate }
      },
      dailyStats: dailyStats.sort((a, b) => new Date(a.date) - new Date(b.date)),
      studentStats,
      attendanceRecords: attendanceRecords.map(record => ({
        id: record._id,
        student: record.student,
        status: record.status || 'present',
        method: record.method || 'face_recognition',
        confidence: record.confidence,
        date: record.createdAt.toISOString().split('T')[0],
        createdAt: record.createdAt
      }))
    };

    console.log('✅ Report generated successfully');
    console.log('📊 Summary:', reportData.summary);

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('❌ Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating attendance report'
    });
  }
});

// Test route
router.get('/test', auth, isAdmin, (req, res) => {
  console.log('🧪 Reports test route hit successfully!');
  res.json({
    success: true,
    message: 'Reports routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
