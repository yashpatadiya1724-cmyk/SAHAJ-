const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile, getAllUsers, banUser, updateRole
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/ban', protect, adminOnly, banUser);
router.put('/users/:id/role', protect, adminOnly, updateRole);

module.exports = router;
