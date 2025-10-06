const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/admin');
const router = express.Router();

// @route   GET /api/classes
// @desc    Get all classes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true })
      .populate('teacher', 'firstName lastName email')
      .populate('students', 'firstName lastName studentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: classes
    });

  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/classes
// @desc    Create new class
// @access  Private/Admin
router.post('/', auth, adminAuth, [
  body('className').trim().notEmpty(),
  body('subject').trim().notEmpty(),
  body('teacher').isMongoId(),
  body('schedule').isObject(),
  body('semester').trim().notEmpty(),
  body('academicYear').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const newClass = new Class(req.body);
    await newClass.save();

    await newClass.populate('teacher', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });

  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating class'
    });
  }
});

module.exports = router;
