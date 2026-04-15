const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// Generate invoice for a confirmed booking (client only)
// Invoices can only be created after a booking is confirmed by both parties
router.post('/', protect, authorize('client'), async (req, res) => {
  const { bookingId, totalAmount, tax } = req.body;
  
  // First, verify the booking exists
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
  // Security: ensure the logged-in client owns this booking, to avoid misunderstandings.
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  
  // Only confirmed bookings can generate an invoice
  // This prevents invoices for pending or cancelled bookings
  if (booking.status !== 'confirmed') {
    return res.status(400).json({ message: 'Booking not confirmed yet' });
  }
  
  // Calculate final amount including tax (default tax to 0 if not provided)
  const grandTotal = totalAmount + (tax || 0);
  
  // Create the invoice with pending payment status
  const invoice = await Invoice.create({
    booking: bookingId,
    totalAmount,
    tax: tax || 0,
    grandTotal,
    paymentStatus: 'pending'
  });
  res.status(201).json(invoice);
});

// Get invoices for the logged-in client
// Shows all invoices belonging to bookings that the client made
router.get('/', protect, authorize('client'), async (req, res) => {
  // First get all booking IDs for this client
  const bookings = await Booking.find({ client: req.user._id }).select('_id');
  
  // Then find invoices where the booking is in that list of IDs
  const invoices = await Invoice.find({ booking: { $in: bookings } }).populate('booking', 'pickupLocation deliveryLocation');
  res.json(invoices);
});

// Pay invoice
// Updates payment status from 'pending' to 'paid'
router.put('/:id/pay', protect, authorize('client'), async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('booking');
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  
  // Verify ownership through the associated booking
  const booking = invoice.booking;
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your invoice' });
  }
  
  // Mark as paid 
  invoice.paymentStatus = 'paid';
  await invoice.save();
  res.json({ message: 'Invoice paid', invoice });
});

module.exports = router;