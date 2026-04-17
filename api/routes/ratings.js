const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Create a rating (client rates transporter/labourer, or vice versa)
// After a booking is completed, users can rate each other (stars 1-5 + optional comment)
router.post('/', protect, async (req, res) => {
  const { bookingId, toUserId, stars, comment } = req.body;
  
  // Find the booking to verify it exists and to check who is involved
  const booking = await Booking.findById(bookingId).populate('selectedQuote');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
  // Determine if the logged-in user is part of this booking (either client or transporter)
  // We are thinking of adding Labourer ratings later, but we will keep it at client to transporter for now cause it is easier.
  const isClient = booking.client.toString() === req.user._id.toString();
   const isTransporter = booking.selectedQuote && booking.selectedQuote.transporter && booking.selectedQuote.transporter.toString() === req.user._id.toString();
  
  if (!isClient && !isTransporter) {
    return res.status(403).json({ message: 'Not authorized to rate this booking' });
  }
  
  // Prevent double rating: one user can only rate a specific booking once
  const existing = await Rating.findOne({ booking: bookingId, fromUser: req.user._id });
  if (existing) {
    return res.status(400).json({ message: 'You have already rated this booking' });
  }
  
  // Create the rating document
  const rating = await Rating.create({
    fromUser: req.user._id,   
    toUser: toUserId,         
    booking: bookingId,
    stars,
    comment
  });
  res.status(201).json(rating);
});

// Get ratings for a specific user (by their user ID)
// Returns all ratings received by that user, plus an average star rating
router.get('/user/:userId', protect, async (req, res) => {
  // Find all ratings where the 'toUser' matches the requested userId
  const ratings = await Rating.find({ toUser: req.params.userId }).populate('fromUser', 'name');
  
  // Calculate average stars (avoid division by zero if no ratings)
  const avgStars = ratings.reduce((acc, r) => acc + r.stars, 0) / (ratings.length || 1);
  
  res.json({ ratings, averageStars: avgStars });
});

module.exports = router;