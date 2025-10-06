const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');


// Middleware to ensure user is admin or instructor/teacher
const isAdminOrInstructor = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !['admin', 'instructor', 'teacher'].includes(user.role)) {  // ✅ Add 'teacher'
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin, instructor, or teacher privileges required.'
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


// GET /api/classes - Get all classes with filters
// GET /api/classes - Get all classes with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      search,
      department,
      semester,
      academicYear,
      instructor,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    console.log('📚 Fetching classes with filters:', req.query);

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (academicYear) filter.academicYear = academicYear;
    if (instructor) filter.instructor = instructor;
    if (isActive !== undefined && isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    console.log('🔍 Applied filters:', filter);

    // Execute query with proper population and error handling
    let classes;
    try {
      classes = await Class.find(filter)
        .populate({
          path: 'instructor',
          select: 'firstName lastName email',
          match: { isActive: true } // Only populate active instructors
        })
        .populate({
          path: 'students',
          select: 'firstName lastName email studentId',
          match: { isActive: true } // Only populate active students
        })
        .populate({
          path: 'createdBy',
          select: 'firstName lastName'
        })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(); // Use lean() for better performance

      console.log('📊 Raw classes found:', classes.length);
      
      // Filter out classes with null instructors (if instructor was deleted)
      classes = classes.filter(cls => cls.instructor !== null);
      
      console.log('📊 Classes after filtering nulls:', classes.length);

    } catch (populateError) {
      console.error('❌ Error in population:', populateError);
      // Fallback: get classes without population
      classes = await Class.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));
      
      console.log('📊 Fallback classes loaded:', classes.length);
    }

    const totalClasses = await Class.countDocuments(filter);

    // Calculate statistics - fix the aggregation
    const statsAggregation = [
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          inactive: {
            $sum: {
              $cond: [{ $eq: ['$isActive', false] }, 1, 0]
            }
          },
          totalStudentsEnrolled: {
            $sum: { $size: { $ifNull: ['$students', []] } }
          }
        }
      }
    ];

    const statsResult = await Class.aggregate(statsAggregation);
    const stats = statsResult[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      totalStudentsEnrolled: 0
    };

    console.log('✅ Sending response:', {
      classesCount: classes.length,
      stats: stats
    });

    res.json({
      success: true,
      classes,
      stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalClasses / parseInt(limit)),
        totalItems: totalClasses,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching classes',
      error: error.message
    });
  }
});


// POST /api/classes - Create new class
router.post('/', [
  auth,
  isAdminOrInstructor,
  body('name').notEmpty().withMessage('Class name is required'),
  body('code').notEmpty().withMessage('Class code is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('instructor').isMongoId().withMessage('Valid instructor ID is required'),
  body('capacity').isInt({ min: 1, max: 200 }).withMessage('Capacity must be between 1 and 200'),
  body('department').notEmpty().withMessage('Department is required'),
  body('semester').notEmpty().withMessage('Semester is required'),
  body('academicYear').notEmpty().withMessage('Academic year is required')
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

    console.log('➕ Creating new class:', req.body);

    // Check if class code already exists
    const existingClass = await Class.findOne({ code: req.body.code.toUpperCase() });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class code already exists'
      });
    }

    // Verify instructor exists
    const instructor = await User.findById(req.body.instructor);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid instructor'
      });
    }

    // Create new class
    const newClass = new Class({
      ...req.body,
      code: req.body.code.toUpperCase(),
      createdBy: req.userId,
      students: [] // Start with empty student list
    });

    await newClass.save();

    // Populate the response
    await newClass.populate('instructor', 'firstName lastName email');
    await newClass.populate('createdBy', 'firstName lastName');

    console.log('✅ Class created successfully:', newClass._id);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      class: newClass
    });

  } catch (error) {
    console.error('❌ Error creating class:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating class'
    });
  }
});

// GET /api/classes/:id - Get single class details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Fetching class details for:', id);

    const classData = await Class.findById(id)
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email studentId faceRegistered')
      .populate('createdBy', 'firstName lastName');

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Get recent attendance for this class
    const recentAttendance = await Attendance.find({
      classId: id
    })
    .populate('student', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      class: classData,
      recentAttendance
    });

  } catch (error) {
    console.error('❌ Error fetching class details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching class details'
    });
  }
});

// PUT /api/classes/:id - Update class
router.put('/:id', [
  auth,
  isAdminOrInstructor,
  body('name').optional().notEmpty().withMessage('Class name cannot be empty'),
  body('capacity').optional().isInt({ min: 1, max: 200 }).withMessage('Capacity must be between 1 and 200')
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

    const { id } = req.params;
    console.log('✏️ Updating class:', id);

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if user can edit this class
    if (req.user.role !== 'admin' && !classData.instructor.equals(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own classes'
      });
    }

    // Update class
    Object.assign(classData, req.body);
    await classData.save();

    // Populate response
    await classData.populate('instructor', 'firstName lastName email');
    await classData.populate('students', 'firstName lastName email studentId');

    console.log('✅ Class updated successfully:', id);

    res.json({
      success: true,
      message: 'Class updated successfully',
      class: classData
    });

  } catch (error) {
    console.error('❌ Error updating class:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating class'
    });
  }
});

// POST /api/classes/:id/enroll - Enroll students in class
router.post('/:id/enroll', [
  auth,
  isAdminOrInstructor,
  body('studentIds').isArray().withMessage('Student IDs must be an array')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    console.log('👥 Enrolling students in class:', id, studentIds);

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify students exist
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      isActive: true
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some students not found or inactive'
      });
    }

    // Check capacity
    const newEnrollmentCount = classData.students.length + studentIds.length;
    if (newEnrollmentCount > classData.capacity) {
      return res.status(400).json({
        success: false,
        message: `Class capacity exceeded. Available slots: ${classData.availableSlots}`
      });
    }

    // Add students (avoid duplicates)
    const enrolledCount = studentIds.reduce((count, studentId) => {
      if (classData.addStudent(studentId)) {
        return count + 1;
      }
      return count;
    }, 0);

    await classData.save();

    console.log('✅ Enrolled', enrolledCount, 'students');

    res.json({
      success: true,
      message: `${enrolledCount} students enrolled successfully`,
      class: classData,
      enrolledCount
    });

  } catch (error) {
    console.error('❌ Error enrolling students:', error);
    res.status(500).json({
      success: false,
      message: 'Error enrolling students'
    });
  }
});

// DELETE /api/classes/:id/students/:studentId - Remove student from class
router.delete('/:id/students/:studentId', auth, isAdminOrInstructor, async (req, res) => {
  try {
    const { id, studentId } = req.params;
    console.log('➖ Removing student from class:', id, studentId);

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    classData.removeStudent(studentId);
    await classData.save();

    console.log('✅ Student removed from class');

    res.json({
      success: true,
      message: 'Student removed from class successfully'
    });

  } catch (error) {
    console.error('❌ Error removing student:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing student from class'
    });
  }
});

// DELETE /api/classes/:id - Delete class
router.delete('/:id', auth, isAdminOrInstructor, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting class:', id);

    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if user can delete this class
    if (req.user.role !== 'admin' && !classData.instructor.equals(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own classes'
      });
    }

    // Delete related attendance records
    await Attendance.deleteMany({ classId: id });

    // Delete the class
    await Class.findByIdAndDelete(id);

    console.log('✅ Class and related data deleted');

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting class:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting class'
    });
  }
});

module.exports = router;
