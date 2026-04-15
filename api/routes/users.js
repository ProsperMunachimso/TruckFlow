const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
// const Booking = require('../models/Booking');

const generateToken = (res, userId) => {
  // Create a token with the user's ID, we made it to expire after 7 days
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  // Set the cookie with various security options
  res.cookie('token', token, {
    httpOnly: true,          
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict',       
    maxAge: 7 * 24 * 60 * 60 * 1000 // Calculates the 7 days we set to milliseconds
  });
  return token;
};

// Register a new user (client, transporter, or labourer)
// Different roles can sign up - each role may have different required fields
router.post('/register', async (req, res) => {
  const { name, email, password, phone, address, role, vehicleDetails, labourerDetails } = req.body;

  // Server-side validation 
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  // Check if a user with this email already exists (unique constraint in schema)
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Create the user object - conditionally include role-specific details
  const user = await User.create({
    name, email, password, phone, address, role,
    vehicleDetails: role === 'transporter' ? vehicleDetails : undefined,
    labourerDetails: role === 'labourer' ? labourerDetails : undefined
  });

  if (user) {
    // Generate JWT and set cookie so user is logged in immediately after registration
    generateToken(res, user._id);
    // Return user info excluding sensitive data like password
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

// Authenticate user and set token cookie
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email });
  
  // Check if user exists and password matches
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

// Clear the token cookie to log the user out
router.post('/logout', (req, res) => {
  // Overwrite the cookie with an empty value that expires immediately
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Get logged-in user's profile protected
// The 'protect' middleware ensures only authenticated users can access this
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

// Get recently viewed bookings (stored in server‑side session)
// This demonstrates active use of express‑session, separate from JWT cookie
router.get('/recent', protect, async (req, res) => {
  if (!req.session.recentBookings || req.session.recentBookings.length === 0) {
    return res.json({ recentBookings: [] });
  }
  // Fetch the actual booking documents from DB
  const bookings = await Booking.find({
    '_id': { $in: req.session.recentBookings }
  }).populate('client', 'name email');
  // Preserve order from session (most recent first)
  const ordered = req.session.recentBookings.map(id => bookings.find(b => b._id.toString() === id)).filter(b => b);
  res.json({ recentBookings: ordered });
});

// Update profile (name, phone, address, password, and role-specific details)
router.put('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    // Update basic fields if provided in the request body
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;
    
    // If the user wants to change password, validate length before saving
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password too short' });
      }
      user.password = req.body.password; 
    }
    
    // Update role-specific fields only if the user has that role
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

// Delete the currently logged-in user's own account
// Requires password confirmation for security
router.delete('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Confirm password
  const { password } = req.body;
  if (!password || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid password – account not deleted' });
  }

  // Optionally delete all bookings created by this user
  // await Booking.deleteMany({ client: user._id });

  await User.deleteOne({ _id: user._id });

  // Clear session and cookie
  req.session.destroy(() => {});
  res.clearCookie('token');

  res.json({ message: 'Account deleted successfully' });
});

module.exports = router;