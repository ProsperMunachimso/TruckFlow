const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// Helper: generate JWT and set cookie
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  return token;
};

// @route POST /api/users/register
// @desc Register a new user (client, transporter, or labourer)
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address, role, vehicleDetails, labourerDetails } = req.body;

  // Server-side validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name, email, password, phone, address, role,
    vehicleDetails: role === 'transporter' ? vehicleDetails : undefined,
    labourerDetails: role === 'labourer' ? labourerDetails : undefined
  });

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// @route POST /api/users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// @route POST /api/users/logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @route GET /api/users/profile
// @desc Get logged-in user's profile (protected)
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

// @route PUT /api/users/profile
// @desc Update profile
router.put('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password too short' });
      }
      user.password = req.body.password;
    }
    // Update role-specific fields if needed
    if (user.role === 'transporter' && req.body.vehicleDetails) {
      user.vehicleDetails = req.body.vehicleDetails;
    }
    if (user.role === 'labourer' && req.body.labourerDetails) {
      user.labourerDetails = req.body.labourerDetails;
    }
    await user.save();
    res.json({ message: 'Profile updated' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

module.exports = router;