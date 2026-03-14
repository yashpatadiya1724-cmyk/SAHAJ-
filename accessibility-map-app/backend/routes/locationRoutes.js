const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getLocations, getLocation, addLocation, voteLocation,
  updateLocation, deleteLocation, flagLocation,
  getDashboard, getFlaggedLocations
} = require('../controllers/locationController');
const { protect, adminOnly, optionalAuth } = require('../middleware/authMiddleware');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'accessibility-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only images and videos are allowed!'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }
});

// Public routes
router.get('/', optionalAuth, getLocations);
router.get('/dashboard', getDashboard);

// Admin routes
router.get('/flagged', protect, adminOnly, getFlaggedLocations);

// Protected routes
router.post('/', protect, upload.array('photos', 5), addLocation);
router.get('/:id', optionalAuth, getLocation);
router.put('/:id', protect, updateLocation);
router.delete('/:id', protect, adminOnly, deleteLocation);
router.post('/:id/vote', protect, voteLocation);
router.put('/:id/flag', protect, adminOnly, flagLocation);

module.exports = router;
