const express = require('express');
const router = express.Router();
const Quote = require('../models/Quote');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// Create a quote (transporter only)
// Transporters can submit a price and details for a pending booking
router.post('/', protect, authorize('transporter'), async (req, res) => {
  const { bookingId, amount, estimatedDurationHours, notes } = req.body;
  
  // Find the booking to make sure it exists and is still pending
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
  // Only pending bookings can receive quotes
  // Once a booking has a confirmed quote, no more quotes should be accepted
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'Booking already quoted or confirmed' });
  }
  
  // Create the quote document with the transporter's ID from the logged-in user
  const quote = await Quote.create({
    booking: bookingId,
    transporter: req.user._id,
    amount,
    estimatedDurationHours,
    notes
  });
  res.status(201).json(quote);
});

// Accept a quote (client only)
// Clients choose one quote among all submitted for their booking
router.put('/:id/accept', protect, authorize('client'), async (req, res) => {
  const quote = await Quote.findById(req.params.id).populate('booking');
  if (!quote) return res.status(404).json({ message: 'Quote not found' });
  
  const booking = quote.booking;
  // Verify that the logged-in client owns this booking
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  
  // Prevent accepting a quote if the booking is no longer pending
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'Booking already confirmed' });
  }
  
  // Mark the quote as accepted
  quote.status = 'accepted';
  await quote.save();
  
  // Update the booking to 'confirmed' and store the selected quote reference
  booking.status = 'confirmed';
  booking.selectedQuote = quote._id;
  await booking.save();
  
  res.json({ message: 'Quote accepted, booking confirmed', quote });
});

// Get all quotes for the logged-in transporter or client
// Transporters see their own quotes; clients see quotes for their bookings
router.get('/', protect, async (req, res) => {
  let filter = {};
  
  if (req.user.role === 'transporter') {
    // Transporters: only quotes they submitted
    filter.transporter = req.user._id;
  } 
  else if (req.user.role === 'client') {
    // Clients: find all bookings they own, then get quotes for those bookings
    const bookings = await Booking.find({ client: req.user._id }).select('_id');
    filter.booking = { $in: bookings.map(b => b._id) };
  }
  // Other roles (labourer, admin) would see nothing or could be extended later
  
  // Populate booking with pickup/delivery locations so users know which job the quote is for
  const quotes = await Quote.find(filter).populate('booking', 'pickupLocation deliveryLocation');
  res.json(quotes);
});

module.exports = router;