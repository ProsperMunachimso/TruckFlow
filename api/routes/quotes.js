const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// @route POST /api/quotes
// @desc Create a quote (transporter only)
router.post('/', protect, authorize('transporter'), async (req, res) => {
  const { bookingId, amount, estimatedDurationHours, notes } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'Booking already quoted or confirmed' });
  }

  const quote = await Quote.create({
    booking: bookingId,
    transporter: req.user._id,
    amount,
    estimatedDurationHours,
    notes
  });
  res.status(201).json(quote);
});

// @route PUT /api/quotes/:id/accept
// @desc Accept a quote (client only)
router.put('/:id/accept', protect, authorize('client'), async (req, res) => {
  const quote = await Quote.findById(req.params.id).populate('booking');
  if (!quote) return res.status(404).json({ message: 'Quote not found' });
  const booking = quote.booking;
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'Booking already confirmed' });
  }

  quote.status = 'accepted';
  await quote.save();
  booking.status = 'confirmed';
  booking.selectedQuote = quote._id;
  await booking.save();

  res.json({ message: 'Quote accepted, booking confirmed', quote });
});

module.exports = router;