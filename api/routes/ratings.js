const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Create a rating (client rates transporter/labourer, or vice versa)
router.post('/', protect, async (req, res) => {
  const { bookingId, toUserId, stars, comment } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  // Check if the user is part of the booking (client or transporter)
  const isClient = booking.client.toString() === req.user._id.toString();
  const isTransporter = booking.selectedQuote && booking.selectedQuote.transporter.toString() === req.user._id.toString();
  if (!isClient && !isTransporter) {
    return res.status(403).json({ message: 'Not authorized to rate this booking' });
  }
  const existing = await Rating.findOne({ booking: bookingId, fromUser: req.user._id });
  if (existing) {
    return res.status(400).json({ message: 'You have already rated this booking' });
  }
  const rating = await Rating.create({
    fromUser: req.user._id,
    toUser: toUserId,
    booking: bookingId,
    stars,
    comment
  });
  res.status(201).json(rating);
});

// Get ratings for a user
router.get('/user/:userId', protect, async (req, res) => {
  const ratings = await Rating.find({ toUser: req.params.userId }).populate('fromUser', 'name');
  const avgStars = ratings.reduce((acc, r) => acc + r.stars, 0) / (ratings.length || 1);
  res.json({ ratings, averageStars: avgStars });
});

module.exports = router;