// const express = require('express');
// const router = express.Router();
// const ClassSession = require('../models/ClassSession');
// const Class = require('../models/Class');
// const User = require('../models/User');
// const Attendance = require('../models/Attendance');
// const auth = require('../middleware/auth');
// const { body, validationResult } = require('express-validator');

// // Middleware to ensure user is admin or instructor
// const isAdminOrInstructor = async (req, res, next) => {
//   try {
//     const user = await User.findById(req.userId);
//     if (!user || !['admin', 'instructor', 'teacher'].includes(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. Admin or instructor privileges required.'
//       });
//     }
//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error verifying privileges'
//     });
//   }
// };

// // GET /api/sessions - Get class sessions with filters
// router.get('/', auth, async (req, res) => {
//   try {
//     const {
//       date,
//       startDate,
//       endDate,
//       classId,
//       instructorId,
//       status,
//       view = 'day' // day, week, month
//     } = req.query;

//     console.log('📅 Fetching sessions with filters:', req.query);

//     let filter = {};
    
//     // Date filtering
//     if (date) {
//       const targetDate = new Date(date);
//       const startOfDay = new Date(targetDate);
//       startOfDay.setHours(0, 0, 0, 0);
//       const endOfDay = new Date(targetDate);
//       endOfDay.setHours(23, 59, 59, 999);
      
//       filter.sessionDate = { $gte: startOfDay, $lte: endOfDay };
//     } else if (startDate && endDate) {
//       filter.sessionDate = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate)
//       };
//     } else {
//       // Default to current week
//       const now = new Date();
//       const startOfWeek = new Date(now);
//       startOfWeek.setDate(now.getDate() - now.getDay());
//       startOfWeek.setHours(0, 0, 0, 0);
      
//       const endOfWeek = new Date(startOfWeek);
//       endOfWeek.setDate(startOfWeek.getDate() + 6);
//       endOfWeek.setHours(23, 59, 59, 999);
      
//       filter.sessionDate = { $gte: startOfWeek, $lte: endOfWeek };
//     }

//     // Additional filters
//     if (classId) filter.class = classId;
//     if (instructorId) filter.instructor = instructorId;
//     if (status) filter.status = status;

//     const sessions = await ClassSession.find(filter)
//       .populate({
//         path: 'class',
//         select: 'name code subject department capacity students',
//         populate: {
//           path: 'students',
//           select: 'firstName lastName email'
//         }
//       })
//       .populate('instructor', 'firstName lastName email')
//       .populate('createdBy', 'firstName lastName')
//       .sort({ sessionDate: 1, scheduledStartTime: 1 });

//     // Group sessions by date for calendar view
//     const groupedSessions = {};
//     sessions.forEach(session => {
//       const dateKey = session.sessionDate.toISOString().split('T')[0];
//       if (!groupedSessions[dateKey]) {
//         groupedSessions[dateKey] = [];
//       }
//       groupedSessions[dateKey].push(session);
//     });

//     // Calculate statistics
//     const stats = {
//       total: sessions.length,
//       scheduled: sessions.filter(s => s.status === 'scheduled').length,
//       active: sessions.filter(s => s.status === 'active').length,
//       completed: sessions.filter(s => s.status === 'completed').length,
//       cancelled: sessions.filter(s => s.status === 'cancelled').length
//     };

//     console.log('✅ Found sessions:', sessions.length);

//     res.json({
//       success: true,
//       sessions,
//       groupedSessions,
//       stats,
//       view
//     });

//   } catch (error) {
//     console.error('❌ Error fetching sessions:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching sessions'
//     });
//   }
// });

// // POST /api/sessions - Create new session
// router.post('/', [
//   auth,
//   isAdminOrInstructor,
//   body('classId').isMongoId().withMessage('Valid class ID is required'),
//   body('sessionDate').isISO8601().withMessage('Valid session date is required'),
//   body('scheduledStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
//   body('scheduledEndTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)')
// ], async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors: errors.array()
//       });
//     }

//     const {
//       classId,
//       sessionDate,
//       scheduledStartTime,
//       scheduledEndTime,
//       sessionType = 'regular',
//       room,
//       topic,
//       description
//     } = req.body;

//     console.log('➕ Creating new session:', req.body);

//     // Verify class exists
//     const classData = await Class.findById(classId).populate('instructor');
//     if (!classData) {
//       return res.status(404).json({
//         success: false,
//         message: 'Class not found'
//       });
//     }

//     // Check for conflicts
//     const sessionStart = new Date(sessionDate);
//     const sessionEnd = new Date(sessionDate);
    
//     const [startHour, startMin] = scheduledStartTime.split(':');
//     const [endHour, endMin] = scheduledEndTime.split(':');
    
//     sessionStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
//     sessionEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

//     const conflictingSessions = await ClassSession.find({
//       sessionDate: {
//         $gte: new Date(sessionDate).setHours(0, 0, 0, 0),
//         $lte: new Date(sessionDate).setHours(23, 59, 59, 999)
//       },
//       $or: [
//         { instructor: classData.instructor._id },
//         { room: room }
//       ],
//       status: { $ne: 'cancelled' },
//       $or: [
//         {
//           scheduledStartTime: { $lt: scheduledEndTime },
//           scheduledEndTime: { $gt: scheduledStartTime }
//         }
//       ]
//     });

//     if (conflictingSessions.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Schedule conflict detected',
//         conflicts: conflictingSessions.map(session => ({
//           time: `${session.scheduledStartTime} - ${session.scheduledEndTime}`,
//           room: session.room,
//           type: conflictingSessions.some(s => s.instructor.equals(classData.instructor._id)) ? 'instructor' : 'room'
//         }))
//       });
//     }

//     // Create session
//     const session = new ClassSession({
//       class: classId,
//       instructor: classData.instructor._id,
//       sessionDate: new Date(sessionDate),
//       scheduledStartTime,
//       scheduledEndTime,
//       sessionType,
//       room: room || classData.schedule?.room,
//       topic,
//       description,
//       createdBy: req.userId
//     });

//     await session.save();

//     // Populate response
//     await session.populate('class', 'name code subject');
//     await session.populate('instructor', 'firstName lastName email');

//     console.log('✅ Session created successfully:', session._id);

//     res.status(201).json({
//       success: true,
//       message: 'Session created successfully',
//       session
//     });

//   } catch (error) {
//     console.error('❌ Error creating session:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating session'
//     });
//   }
// });

// // GET /api/sessions/:id - Get specific session details
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log('🔍 Fetching session details for:', id);

//     const session = await ClassSession.findById(id)
//       .populate({
//         path: 'class',
//         select: 'name code subject students',
//         populate: {
//           path: 'students',
//           select: 'firstName lastName email studentId'
//         }
//       })
//       .populate('instructor', 'firstName lastName email')
//       .populate('attendanceRecords.student', 'firstName lastName email studentId');

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     res.json({
//       success: true,
//       session
//     });

//   } catch (error) {
//     console.error('❌ Error fetching session details:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching session details'
//     });
//   }
// });

// // POST /api/sessions/:id/start - Start a session
// router.post('/:id/start', auth, isAdminOrInstructor, async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log('▶️ Starting session:', id);

//     const session = await ClassSession.findById(id).populate('class');
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     // Check if user can start this session
//     if (req.user.role !== 'admin' && !session.instructor.equals(req.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: 'You can only start your own sessions'
//       });
//     }

//     if (session.status === 'active') {
//       return res.status(400).json({
//         success: false,
//         message: 'Session is already active'
//       });
//     }

//     await session.startSession();
//     await session.populate('instructor', 'firstName lastName');

//     console.log('✅ Session started successfully');

//     res.json({
//       success: true,
//       message: 'Session started successfully',
//       session
//     });

//   } catch (error) {
//     console.error('❌ Error starting session:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error starting session'
//     });
//   }
// });

// // POST /api/sessions/:id/end - End a session
// router.post('/:id/end', auth, isAdminOrInstructor, async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log('⏹️ Ending session:', id);

//     const session = await ClassSession.findById(id).populate('class');
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     // Check if user can end this session
//     if (req.user.role !== 'admin' && !session.instructor.equals(req.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: 'You can only end your own sessions'
//       });
//     }

//     if (session.status !== 'active') {
//       return res.status(400).json({
//         success: false,
//         message: 'Session is not currently active'
//       });
//     }

//     await session.endSession();
//     await session.populate('instructor', 'firstName lastName');

//     console.log('✅ Session ended successfully');

//     res.json({
//       success: true,
//       message: 'Session ended successfully',
//       session
//     });

//   } catch (error) {
//     console.error('❌ Error ending session:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error ending session'
//     });
//   }
// });

// // POST /api/sessions/:id/qr - Generate QR code for session
// router.post('/:id/qr', auth, isAdminOrInstructor, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { expirationMinutes = 60 } = req.body;

//     console.log('📱 Generating QR code for session:', id);

//     const session = await ClassSession.findById(id);
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     await session.generateQRCode(expirationMinutes);

//     console.log('✅ QR code generated successfully');

//     res.json({
//       success: true,
//       message: 'QR code generated successfully',
//       qrCode: session.qrCode
//     });

//   } catch (error) {
//     console.error('❌ Error generating QR code:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error generating QR code'
//     });
//   }
// });

// module.exports = router;




















// new updated code from here
const express = require('express');
const router = express.Router();
const ClassSession = require('../models/ClassSession');
const Class = require('../models/Class');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Middleware to ensure user is admin or instructor
const isAdminOrInstructor = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !['admin', 'instructor', 'teacher'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or instructor privileges required.'
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying privileges'
    });
  }
};

// GET /api/sessions - Get class sessions with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      date,
      startDate,
      endDate,
      classId,
      instructorId,
      status,
      view = 'day'
    } = req.query;

    console.log('📅 Fetching sessions with filters:', req.query);

    let filter = {};
    
    // Date filtering
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.sessionDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      filter.sessionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      filter.sessionDate = { $gte: startOfWeek, $lte: endOfWeek };
    }

    // Additional filters
    if (classId) filter.class = classId;
    if (instructorId) filter.instructor = instructorId;
    if (status) filter.status = status;

    const sessions = await ClassSession.find(filter)
      .populate({
        path: 'class',
        select: 'name code subject department capacity students',
        populate: {
          path: 'students',
          select: 'firstName lastName email'
        }
      })
      .populate('instructor', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ sessionDate: 1, scheduledStartTime: 1 });

    // Group sessions by date for calendar view
    const groupedSessions = {};
    sessions.forEach(session => {
      const dateKey = session.sessionDate.toISOString().split('T')[0];
      if (!groupedSessions[dateKey]) {
        groupedSessions[dateKey] = [];
      }
      groupedSessions[dateKey].push(session);
    });

    // Calculate statistics
    const stats = {
      total: sessions.length,
      scheduled: sessions.filter(s => s.status === 'scheduled').length,
      active: sessions.filter(s => s.status === 'active').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      cancelled: sessions.filter(s => s.status === 'cancelled').length
    };

    console.log('✅ Found sessions:', sessions.length);

    res.json({
      success: true,
      sessions,
      groupedSessions,
      stats,
      view
    });

  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
});

// POST /api/sessions - Create new session
router.post('/', [
  auth,
  isAdminOrInstructor,
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('sessionDate').isISO8601().withMessage('Valid session date is required'),
  body('scheduledStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
  body('scheduledEndTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)')
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

    const {
      classId,
      sessionDate,
      scheduledStartTime,
      scheduledEndTime,
      sessionType = 'regular',
      room,
      topic,
      description
    } = req.body;

    console.log('➕ Creating new session:', req.body);

    // Verify class exists
    const classData = await Class.findById(classId).populate('instructor');
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // ✅ FIXED: Check for conflicts - same date, same instructor OR same room, overlapping times
    const sessionDateObj = new Date(sessionDate);
    const startOfDay = new Date(sessionDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingSessions = await ClassSession.find({
      sessionDate: { $gte: startOfDay, $lte: endOfDay }, // ✅ Same date
      $or: [
        { instructor: classData.instructor._id }, // Same instructor
        { room: room } // Same room (if room specified)
      ],
      status: { $ne: 'cancelled' },
      // ✅ FIXED: Check for time overlap
      $and: [
        { scheduledStartTime: { $lt: scheduledEndTime } },
        { scheduledEndTime: { $gt: scheduledStartTime } }
      ]
    });

    if (conflictingSessions.length > 0) {
      console.log('⚠️ Schedule conflicts found:', conflictingSessions.length);
      return res.status(400).json({
        success: false,
        message: 'Schedule conflict detected',
        conflicts: conflictingSessions.map(session => ({
          className: session.class?.name,
          time: `${session.scheduledStartTime} - ${session.scheduledEndTime}`,
          room: session.room,
          type: session.instructor.equals(classData.instructor._id) ? 'instructor' : 'room'
        }))
      });
    }

    // Create session
    const session = new ClassSession({
      class: classId,
      instructor: classData.instructor._id,
      sessionDate: new Date(sessionDate),
      scheduledStartTime,
      scheduledEndTime,
      sessionType,
      room: room || classData.schedule?.room,
      topic,
      description,
      createdBy: req.userId
    });

    await session.save();

    // Populate response
    await session.populate('class', 'name code subject');
    await session.populate('instructor', 'firstName lastName email');

    console.log('✅ Session created successfully:', session._id);

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session
    });

  } catch (error) {
    console.error('❌ Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating session'
    });
  }
});

// ✅ NEW: PUT /api/sessions/:id - Update session
router.put('/:id', [
  auth,
  isAdminOrInstructor,
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('sessionDate').isISO8601().withMessage('Valid session date is required'),
  body('scheduledStartTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
  body('scheduledEndTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)')
], async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      classId,
      sessionDate,
      scheduledStartTime,
      scheduledEndTime,
      sessionType = 'regular',
      room,
      topic,
      description
    } = req.body;

    console.log('✏️ Updating session:', id, req.body);

    // Find existing session
    const existingSession = await ClassSession.findById(id);
    if (!existingSession) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user can update this session
    if (req.user.role !== 'admin' && !existingSession.instructor.equals(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own sessions'
      });
    }

    // Verify class exists
    const classData = await Class.findById(classId).populate('instructor');
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check for conflicts (excluding current session)
    const sessionDateObj = new Date(sessionDate);
    const startOfDay = new Date(sessionDateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingSessions = await ClassSession.find({
      _id: { $ne: id }, // ✅ Exclude current session
      sessionDate: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { instructor: classData.instructor._id },
        { room: room }
      ],
      status: { $ne: 'cancelled' },
      $and: [
        { scheduledStartTime: { $lt: scheduledEndTime } },
        { scheduledEndTime: { $gt: scheduledStartTime } }
      ]
    });

    if (conflictingSessions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedule conflict detected',
        conflicts: conflictingSessions.map(session => ({
          className: session.class?.name,
          time: `${session.scheduledStartTime} - ${session.scheduledEndTime}`,
          room: session.room,
          type: session.instructor.equals(classData.instructor._id) ? 'instructor' : 'room'
        }))
      });
    }

    // Update session
    const updatedSession = await ClassSession.findByIdAndUpdate(id, {
      class: classId,
      instructor: classData.instructor._id,
      sessionDate: new Date(sessionDate),
      scheduledStartTime,
      scheduledEndTime,
      sessionType,
      room: room || classData.schedule?.room,
      topic,
      description
    }, { new: true })
      .populate('class', 'name code subject')
      .populate('instructor', 'firstName lastName email');

    console.log('✅ Session updated successfully:', updatedSession._id);

    res.json({
      success: true,
      message: 'Session updated successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('❌ Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating session'
    });
  }
});

// ✅ NEW: DELETE /api/sessions/:id - Delete session
router.delete('/:id', auth, isAdminOrInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting session:', id);

    const session = await ClassSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user can delete this session
    if (req.user.role !== 'admin' && !session.instructor.equals(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own sessions'
      });
    }

    // Prevent deletion of active sessions
    if (session.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active session. Please end the session first.'
      });
    }

    await ClassSession.findByIdAndDelete(id);

    console.log('✅ Session deleted successfully');

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting session:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting session'
    });
  }
});

// GET /api/sessions/:id - Get specific session details
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log('🔍 Fetching session details for:', id);

//     const session = await ClassSession.findById(id)
//       .populate({
//         path: 'class',
//         select: 'name code subject students',
//         populate: {
//           path: 'students',
//           select: 'firstName lastName email studentId'
//         }
//       })
//       .populate('instructor', 'firstName lastName email')
//       .populate('attendanceRecords.student', 'firstName lastName email studentId');

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     res.json({
//       success: true,
//       session
//     });

//   } catch (error) {
//     console.error('❌ Error fetching session details:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching session details'
//     });
//   }
// });




// GET /api/sessions/:id - Get specific session details (FIXED)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching session details for:', id);

    const session = await ClassSession.findById(id)
      .populate({
        path: 'class',
        select: 'name code subject students',
        populate: {
          path: 'students',
          select: 'firstName lastName email studentId'
        }
      })
      .populate('instructor', 'firstName lastName email')
      .populate('attendanceRecords.student', 'firstName lastName email studentId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // ✅ RECALCULATE STATS ON FETCH
    session.calculateAttendanceStats();
    await session.save();

    res.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('❌ Error fetching session details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session details'
    });
  }
});








// POST /api/sessions/:id/start - Start a session
router.post('/:id/start', auth, isAdminOrInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('▶️ Starting session:', id);

    const session = await ClassSession.findById(id).populate('class');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user can start this session
    if (req.user.role !== 'admin' && !session.instructor.equals(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only start your own sessions'
      });
    }

    if (session.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is already active'
      });
    }

    await session.startSession();
    await session.populate('instructor', 'firstName lastName');

    console.log('✅ Session started successfully');

    res.json({
      success: true,
      message: 'Session started successfully',
      session
    });

  } catch (error) {
    console.error('❌ Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting session'
    });
  }
});

// POST /api/sessions/:id/end - End a session
router.post('/:id/end', auth, isAdminOrInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('⏹️ Ending session:', id);

    const session = await ClassSession.findById(id).populate('class');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user can end this session
    if (req.user.role !== 'admin' && !session.instructor.equals(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only end your own sessions'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not currently active'
      });
    }

    await session.endSession();
    await session.populate('instructor', 'firstName lastName');

    console.log('✅ Session ended successfully');

    res.json({
      success: true,
      message: 'Session ended successfully',
      session
    });

  } catch (error) {
    console.error('❌ Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending session'
    });
  }
});

// POST /api/sessions/:id/qr - Generate QR code for session
router.post('/:id/qr', auth, isAdminOrInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    const { expirationMinutes = 60 } = req.body;

    console.log('📱 Generating QR code for session:', id);

    const session = await ClassSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.generateQRCode(expirationMinutes);

    console.log('✅ QR code generated successfully');

    res.json({
      success: true,
      message: 'QR code generated successfully',
      qrCode: session.qrCode
    });

  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR code'
    });
  }
});



// student routes
// GET /api/sessions/student/schedule - Get student's class schedule
router.get('/student/schedule', auth, async (req, res) => {
  try {
    console.log('📚 Loading student schedule for user:', req.userId);

    // Find classes where student is enrolled
    const enrolledClasses = await Class.find({
      students: req.userId,
      isActive: true
    }).select('_id');

    const classIds = enrolledClasses.map(c => c._id);

    if (classIds.length === 0) {
      return res.json({
        success: true,
        sessions: [],
        message: 'No enrolled classes found'
      });
    }

    // Get sessions for enrolled classes (current week and future)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const sessions = await ClassSession.find({
      class: { $in: classIds },
      sessionDate: { $gte: oneWeekAgo },
      status: { $ne: 'cancelled' }
    })
      .populate('class', 'name code subject')
      .populate('instructor', 'firstName lastName')
      .populate('attendanceRecords.student', 'firstName lastName')
      .sort({ sessionDate: 1, scheduledStartTime: 1 });

    console.log('✅ Found student sessions:', sessions.length);

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('❌ Error loading student schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading student schedule'
    });
  }
});

// POST /api/sessions/:id/attendance - Mark student attendance
// Add this to your existing sessions.js file, after the existing routes:

// POST /api/sessions/:id/attendance - Mark student attendance
// router.post('/:id/attendance', auth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { method = 'face_recognition', confidence } = req.body;

//     console.log('✅ Marking attendance for session:', id, 'by user:', req.userId);

//     const session = await ClassSession.findById(id).populate('class');
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     // Check if session is active
//     if (session.status !== 'active') {
//       return res.status(400).json({
//         success: false,
//         message: 'Session must be active to mark attendance'
//       });
//     }

//     // Check if student is enrolled in this class
//     if (!session.class.students.includes(req.userId)) {
//       return res.status(403).json({
//         success: false,
//         message: 'You are not enrolled in this class'
//       });
//     }

//     // Check if attendance already marked
//     const existingRecord = session.attendanceRecords.find(record => 
//       record.student.toString() === req.userId
//     );

//     if (existingRecord) {
//       return res.status(400).json({
//         success: false,
//         message: 'Attendance already marked for this session'
//       });
//     }

//     // Check if within attendance time window
//     const now = new Date();
//     const sessionDate = new Date(session.sessionDate);
//     const [startHour, startMin] = session.scheduledStartTime.split(':');
//     const [endHour, endMin] = session.scheduledEndTime.split(':');
    
//     const sessionStart = new Date(sessionDate);
//     sessionStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
    
//     const sessionEnd = new Date(sessionDate);
//     sessionEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
    
//     // Allow attendance 10 minutes before and 15 minutes after session
//     const attendanceStart = new Date(sessionStart.getTime() - 10 * 60 * 1000);
//     const attendanceEnd = new Date(sessionEnd.getTime() + 15 * 60 * 1000);
    
//     if (now < attendanceStart || now > attendanceEnd) {
//       return res.status(400).json({
//         success: false,
//         message: 'Attendance can only be marked during the session time window'
//       });
//     }

//     // Determine if student is late
//     let status = 'present';
//     if (now > sessionStart) {
//       // If more than 10 minutes late, mark as late
//       const lateThreshold = new Date(sessionStart.getTime() + 10 * 60 * 1000);
//       if (now > lateThreshold) {
//         status = 'late';
//       }
//     }

//     // Mark attendance
//     await session.markAttendance(req.userId, status, method, confidence);

//     console.log('✅ Attendance marked successfully as:', status);

//     res.json({
//       success: true,
//       message: `Attendance marked successfully as ${status}`,
//       status: status
//     });

//   } catch (error) {
//     console.error('❌ Error marking attendance:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error marking attendance'
//     });
//   }
// });


// POST /api/sessions/:id/attendance - Mark student attendance (FIXED)
router.post('/:id/attendance', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { method = 'face_recognition', confidence } = req.body;

    console.log('✅ Marking attendance for session:', id, 'by user:', req.userId);

    const session = await ClassSession.findById(id).populate('class');
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is active
    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session must be active to mark attendance'
      });
    }

    // Check if student is enrolled in this class
    if (!session.class.students.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    // ✅ CRITICAL FIX: Check if attendance already marked
    const existingRecord = session.attendanceRecords.find(record => 
      record.student.toString() === req.userId.toString()
    );

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: `Attendance already marked as "${existingRecord.status}" at ${existingRecord.markedAt.toLocaleTimeString()}`
      });
    }

    // Check if within attendance time window
    const now = new Date();
    const sessionDate = new Date(session.sessionDate);
    const [startHour, startMin] = session.scheduledStartTime.split(':');
    const [endHour, endMin] = session.scheduledEndTime.split(':');
    
    const sessionStart = new Date(sessionDate);
    sessionStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
    
    const sessionEnd = new Date(sessionDate);
    sessionEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
    
    // Allow attendance 10 minutes before and 15 minutes after session
    const attendanceStart = new Date(sessionStart.getTime() - 10 * 60 * 1000);
    const attendanceEnd = new Date(sessionEnd.getTime() + 15 * 60 * 1000);
    
    if (now < attendanceStart || now > attendanceEnd) {
      return res.status(400).json({
        success: false,
        message: 'Attendance can only be marked during the session time window'
      });
    }

    // Determine if student is late
    let status = 'present';
    if (now > sessionStart) {
      // If more than 10 minutes late, mark as late
      const lateThreshold = new Date(sessionStart.getTime() + 10 * 60 * 1000);
      if (now > lateThreshold) {
        status = 'late';
      }
    }

    // ✅ FIXED: Mark attendance (this will prevent duplicates)
    await session.markAttendance(req.userId, status, method, confidence);

    // ✅ FIXED: Populate updated data for response
    await session.populate('attendanceRecords.student', 'firstName lastName email studentId');

    console.log('✅ Attendance marked successfully as:', status);
    console.log('📊 Updated stats:', session.attendanceStats);

    res.json({
      success: true,
      message: `Attendance marked successfully as ${status}`,
      status: status,
      attendanceStats: session.attendanceStats
    });

  } catch (error) {
    console.error('❌ Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance'
    });
  }
});






// student routes



module.exports = router;
