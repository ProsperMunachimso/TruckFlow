const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// @route POST /api/bookings
// @desc Create a booking (client only)
router.post('/', protect, authorize('client'), async (req, res) => {
  const { pickupLocation, deliveryLocation, cargoType, weightKg, dimensions, pickupDate, needLoadingAssistance, needUnloadingAssistance, specialInstructions } = req.body;

  // Server-side validation
  if (!pickupLocation || !deliveryLocation || !pickupDate) {
    return res.status(400).json({ message: 'Pickup, delivery and date are required' });
  }
  if (weightKg && (weightKg <= 0 || weightKg > 50000)) {
    return res.status(400).json({ message: 'Weight must be between 1 and 50000 kg' });
  }

  const booking = await Booking.create({
    client: req.user._id,
    pickupLocation,
    deliveryLocation,
    cargoType,
    weightKg,
    dimensions,
    pickupDate: new Date(pickupDate),
    needLoadingAssistance: needLoadingAssistance || false,
    needUnloadingAssistance: needUnloadingAssistance || false,
    specialInstructions,
    status: 'pending'
  });

  res.status(201).json(booking);
});

// @route GET /api/bookings
// @desc Get all bookings for the logged-in user (clients see their own, transporters see pending)
router.get('/', protect, async (req, res) => {
  let filter = {};
  if (req.user.role === 'client') {
    filter.client = req.user._id;
  } else if (req.user.role === 'transporter') {
    // For simplicity, show all pending bookings
    filter.status = 'pending';
  }
  const bookings = await Booking.find(filter).populate('client', 'name email');
  res.json(bookings);
});

// @route GET /api/bookings/:id
// @desc Get single booking
router.get('/:id', protect, async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('client', 'name email');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  // Check if user is allowed to view (client who owns it, or transporter)
  if (req.user.role === 'client' && booking.client._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(booking);
});

// @route PUT /api/bookings/:id
// @desc Update a booking (client only, only if pending)
router.put('/:id', protect, authorize('client'), async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending bookings can be edited' });
  }

  const { pickupLocation, deliveryLocation, weightKg, pickupDate, specialInstructions } = req.body;
  if (pickupLocation) booking.pickupLocation = pickupLocation;
  if (deliveryLocation) booking.deliveryLocation = deliveryLocation;
  if (weightKg) booking.weightKg = weightKg;
  if (pickupDate) booking.pickupDate = pickupDate;
  if (specialInstructions) booking.specialInstructions = specialInstructions;

  await booking.save();
  res.json(booking);
});

// @route DELETE /api/bookings/:id
// @desc Delete a booking (client only, only if pending)
router.delete('/:id', protect, authorize('client'), async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending bookings can be deleted' });
  }
  await booking.deleteOne();
  res.json({ message: 'Booking removed' });
});

module.exports = router;