const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - only allows access if user is authenticated
const protect = async (req, res, next) => {
  let token; // variable to store the JWT token
  
  // Check if the token is stored in cookies.
  if (req.cookies.token) {
    token = req.cookies.token;
  } 
  // If not in cookies, check the Authorization header (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract the token part.
    token = req.headers.authorization.split(' ')[1];
  }
  
  // If no token found anywhere, reject with 401 Unauthorized
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  
  try {
    // Verify the token using the secret from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find the user from the decoded token's id, but exclude the password field
    req.user = await User.findById(decoded.id).select('-password');
    next(); // Token is valid, proceed to the next middleware/route handler
  } catch (error) {
    // If verification fails (expired, invalid signature, etc.), reject
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Middleware factory to restrict access based on user roles
// Takes a list of allowed roles 
const authorize = (...roles) => {
  // Returns an actual middleware function
  return (req, res, next) => {
    // Check if the user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      // If not, respond with 403 Forbidden
      return res.status(403).json({ message: `Role ${req.user.role} not allowed` });
    }
    next(); // User has an allowed role, continue
  };
};

// Export both middleware functions so they can be used in routes
module.exports = { protect, authorize };