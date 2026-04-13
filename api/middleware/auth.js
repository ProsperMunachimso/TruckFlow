const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes – verify JWT token from cookie or Authorization header
const protect = async (req, res, next) => {
  let token;

  // Check cookie first
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // Then check Authorization header (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} not allowed` });
    }
    next();
  };
};

module.exports = { protect, authorize };