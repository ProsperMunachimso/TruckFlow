const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// Generate invoice for a confirmed booking (client only)
router.post('/', protect, authorize('client'), async (req, res) => {
  const { bookingId, totalAmount, tax } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  if (booking.status !== 'confirmed') {
    return res.status(400).json({ message: 'Booking not confirmed yet' });
  }
  const grandTotal = totalAmount + (tax || 0);
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
router.get('/', protect, authorize('client'), async (req, res) => {
  const bookings = await Booking.find({ client: req.user._id }).select('_id');
  const invoices = await Invoice.find({ booking: { $in: bookings } }).populate('booking', 'pickupLocation deliveryLocation');
  res.json(invoices);
});

// Pay invoice (simulate payment)
router.put('/:id/pay', protect, authorize('client'), async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('booking');
  if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
  const booking = invoice.booking;
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your invoice' });
  }
  invoice.paymentStatus = 'paid';
  await invoice.save();
  res.json({ message: 'Invoice paid', invoice });
});

module.exports = router;