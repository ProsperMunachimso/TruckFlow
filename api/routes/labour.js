const express = require('express');
const router = express.Router();
const LabourRequest = require('../models/LabourRequests');
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// Create a labour request (client only)
router.post('/', protect, authorize('client'), async (req, res) => {
  const { bookingId, type, numberOfLabourers, hours } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  const labourReq = await LabourRequest.create({
    booking: bookingId,
    type,
    numberOfLabourers,
    hours,
    status: 'pending'
  });
  res.status(201).json(labourReq);
});

// Get labour requests for the logged-in user
router.get('/', protect, async (req, res) => {
  let filter = {};
  if (req.user.role === 'client') {
    const bookings = await Booking.find({ client: req.user._id }).select('_id');
    filter.booking = { $in: bookings.map(b => b._id) };
  } else if (req.user.role === 'labourer') {
    filter.labourer = req.user._id;
  }
  const requests = await LabourRequest.find(filter).populate('booking', 'pickupLocation deliveryLocation');
  res.json(requests);
});

// Assign a labourer (admin or system – simplified: labourer accepts)
router.put('/:id/assign', protect, authorize('labourer'), async (req, res) => {
  const request = await LabourRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'pending') {
    return res.status(400).json({ message: 'Already assigned or completed' });
  }
  request.labourer = req.user._id;
  request.status = 'assigned';
  await request.save();
  res.json({ message: 'Labour request assigned', request });
});

module.exports = router;