const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect, authorize } = require('../middleware/auth');

// Create a booking (client only)
// Only authenticated clients can create a booking
router.post('/', protect, authorize('client'), async (req, res) => {
  // Destructure all the booking details from the request body
  const { pickupLocation, deliveryLocation, cargoType, weightKg, dimensions, pickupDate, needLoadingAssistance, needUnloadingAssistance, specialInstructions } = req.body;

  // Server-side validation - important because frontend validation can be bypassed
  if (!pickupLocation || !deliveryLocation || !pickupDate) {
    return res.status(400).json({ message: 'Pickup, delivery and date are required' });
  }
  // Weight must be realistic (1kg to 50,000kg / 50 tons)
  if (weightKg && (weightKg <= 0 || weightKg > 50000)) {
    return res.status(400).json({ message: 'Weight must be between 1 and 50000 kg' });
  }

  // Create the booking document in the database
  // client field is taken from the logged-in user (from protect middleware)
  const booking = await Booking.create({
    client: req.user._id,
    pickupLocation,
    deliveryLocation,
    cargoType,
    weightKg,
    dimensions,
    pickupDate: new Date(pickupDate), // Convert to Date object
    needLoadingAssistance: needLoadingAssistance || false, // Default false if not provided
    needUnloadingAssistance: needUnloadingAssistance || false,
    specialInstructions,
    status: 'pending' // New bookings always start as pending
  });

  // 201 Created status code for successful resource creation
  res.status(201).json(booking);
});

// Get all bookings for the logged-in user (clients see their own, transporters see pending)
// Different roles see different bookings based on business logic
router.get('/', protect, async (req, res) => {
  let filter = {}; 
  
  // Clients: only see bookings they created
  if (req.user.role === 'client') {
    filter.client = req.user._id;
  } 
  // Transporters: see all pending bookings that need quotes we made it simplified for now but will expand later
  else if (req.user.role === 'transporter') {
    filter.status = 'pending';
  }
  // Labourers might see something else later, but for now they get empty array
  
  // Populate the client field with name and email so we know who requested it
  const bookings = await Booking.find(filter).populate('client', 'name email');
  res.json(bookings);
});

// Get single booking by ID
router.get('/:id', protect, async (req, res) => {
  // Fetch booking and include client's name and email
  const booking = await Booking.findById(req.params.id).populate('client', 'name email');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
  // Authorization: clients can only see their own bookings, transporters can see any
  // But we need to prevent a client from viewing another client's booking
  if (req.user.role === 'client' && booking.client._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(booking);
});

// Update a booking (client only, only if still pending)
// Once a booking is quoted or confirmed, it shouldn't be changed, to prevent fraud or we are thinking of adding cancellation and a cancelletion fee.
router.put('/:id', protect, authorize('client'), async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
  // Make sure the client owns this booking
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  
  // Only pending bookings can be edited - prevents changes after quotes are made
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending bookings can be edited' });
  }

  // Destructure only the fields that are allowed to be updated
  const { pickupLocation, deliveryLocation, weightKg, pickupDate, specialInstructions } = req.body;
  
  // Update each field if provided in the request
  if (pickupLocation) booking.pickupLocation = pickupLocation;
  if (deliveryLocation) booking.deliveryLocation = deliveryLocation;
  if (weightKg) booking.weightKg = weightKg;
  if (pickupDate) booking.pickupDate = pickupDate;
  if (specialInstructions) booking.specialInstructions = specialInstructions;

  await booking.save();
  res.json(booking);
});

// Delete a booking (client only, only if pending)
// Similar to update, only pending bookings can be deleted
router.delete('/:id', protect, authorize('client'), async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
  // Ownership check
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  
  // Status check - can't delete if already quoted or in progress
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending bookings can be deleted' });
  }
  
  await booking.deleteOne();
  res.json({ message: 'Booking removed' });
});

module.exports = router;