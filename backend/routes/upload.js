const express = require('express');
const path = require('path');
const { uploadProfileImage, uploadFaceImage, deleteFile } = require('../middleware/upload');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// @route   POST /api/upload/profile
// @desc    Upload profile image
// @access  Private
router.post('/profile', auth, (req, res) => {
  uploadProfileImage(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    try {
      // Update user profile with image path
      const user = await User.findById(req.userId);
      if (user.profileImage) {
        // Delete old image
        deleteFile(user.profileImage);
      }

      user.profileImage = req.file.path;
      await user.save();

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        imageUrl: `/uploads/${req.file.filename}`,
        imagePath: req.file.path
      });

    } catch (error) {
      // Clean up uploaded file if database update fails
      deleteFile(req.file.path);
      
      res.status(500).json({
        success: false,
        message: 'Error updating profile image'
      });
    }
  });
});

// @route   POST /api/upload/face-temp
// @desc    Upload temporary face image for processing
// @access  Private
router.post('/face-temp', auth, (req, res) => {
  uploadFaceImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No face image uploaded'
      });
    }

    res.json({
      success: true,
      message: 'Face image uploaded successfully',
      tempImagePath: req.file.path,
      imageUrl: `/uploads/faces/temp/${req.file.filename}`
    });
  });
});

// @route   DELETE /api/upload/:filename
// @desc    Delete uploaded file
// @access  Private
router.delete('/:filename', auth, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    const deleted = deleteFile(filePath);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
});

module.exports = router;
