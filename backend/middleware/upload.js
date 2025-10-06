const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration for profile images
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const uniqueSuffix = `${req.userId}_${Date.now()}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// Storage configuration for face images (temporary)
const faceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/faces/temp';
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `face_${req.userId}_${Date.now()}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// Storage configuration for documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    createUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `doc_${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// File filter for documents
const documentFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (pdf, doc, docx, txt, xls, xlsx)'));
  }
};

// File size limits
const limits = {
  profileImage: { fileSize: 5 * 1024 * 1024 }, // 5MB
  faceImage: { fileSize: 2 * 1024 * 1024 },    // 2MB
  document: { fileSize: 10 * 1024 * 1024 }     // 10MB
};

// Multer configurations
const uploadProfileImage = multer({
  storage: profileStorage,
  limits: limits.profileImage,
  fileFilter: imageFilter
}).single('profileImage');

const uploadFaceImage = multer({
  storage: faceStorage,
  limits: limits.faceImage,
  fileFilter: imageFilter
}).single('faceImage');

const uploadDocument = multer({
  storage: documentStorage,
  limits: limits.document,
  fileFilter: documentFilter
}).single('document');

// Multiple file upload for batch operations
const uploadMultipleImages = multer({
  storage: profileStorage,
  limits: limits.profileImage,
  fileFilter: imageFilter
}).array('images', 10); // Max 10 images

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
  }
  
  if (error?.message?.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

// Utility function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Utility function to clean up temporary files
const cleanupTempFiles = () => {
  const tempDir = 'uploads/faces/temp';
  if (fs.existsSync(tempDir)) {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        deleteFile(filePath);
      }
    });
  }
};

// Run cleanup every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = {
  uploadProfileImage,
  uploadFaceImage,
  uploadDocument,
  uploadMultipleImages,
  handleUploadError,
  deleteFile,
  cleanupTempFiles
};
