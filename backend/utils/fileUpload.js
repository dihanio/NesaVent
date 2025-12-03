const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
};

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

// Storage configuration for event images
const eventImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/events';
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `event-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for KTM (student ID card)
const ktmStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/ktm';
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const userId = req.user?._id || 'unknown';
    cb(null, `ktm-${userId}-${uniqueSuffix}${ext}`);
  }
});

// Storage configuration for avatar
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/avatars';
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const userId = req.user?._id || 'unknown';
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
  }
};

// File filter for documents (KTM)
const documentFileFilter = (req, file, cb) => {
  if (ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Only PDF and images are allowed.'), false);
  }
};

// Multer configurations
const uploadEventImage = multer({
  storage: eventImageStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
});

const uploadKTM = multer({
  storage: ktmStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.document },
  fileFilter: documentFileFilter
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: FILE_SIZE_LIMITS.image },
  fileFilter: imageFileFilter
});

// Helper function to delete file
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

// Helper function to get file size in KB
const getFileSizeInKB = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return (stats.size / 1024).toFixed(2);
  } catch (error) {
    return 0;
  }
};

// Middleware to handle multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB for images and 10MB for documents.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected field in upload.'
      });
    }
    return res.status(400).json({
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      message: err.message
    });
  }
  
  next();
};

module.exports = {
  uploadEventImage,
  uploadKTM,
  uploadAvatar,
  deleteFile,
  getFileSizeInKB,
  handleUploadError,
  ensureDirectoryExists
};
