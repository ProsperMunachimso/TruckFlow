const mongoose = require('mongoose');
const ratingSchema = new mongoose.Schema({
  // Rating schema - allows users to rate each other after a booking is completed
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  
  // Number of stars given (1-5, where 5 is best)
  // Required - every rating needs a score
  stars: { type: Number, min: 1, max: 5, required: true },
  
  // Optional text feedback explaining the rating
  // Helps other users understand why someone got a certain score
  comment: String,
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rating', ratingSchema);