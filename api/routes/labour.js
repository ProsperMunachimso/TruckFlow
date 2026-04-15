const express = require('express');
const router = express.Router();
const LabourRequest = require('../models/LabourRequests'); 
const Booking = require('../models/Booking'); 
const { protect, authorize } = require('../middleware/auth'); 

// Create a labour request (client only)
// Clients can request extra help for loading/unloading after creating a booking
router.post('/', protect, authorize('client'), async (req, res) => {
  const { bookingId, type, numberOfLabourers, hours } = req.body;
  
  // Find the associated booking to verify it exists
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  
  // Security: ensure the client owns this booking
  if (booking.client.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not your booking' });
  }
  
  // Create the labour request with status 'pending' (no labourer assigned yet)
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
// Different roles see different requests:
// - Clients see requests from their own bookings
// - Labourers see requests assigned to them
// - Transporters might not see any (but could be added later)
router.get('/', protect, async (req, res) => {
  let filter = {};
  
  if (req.user.role === 'client') {
    // First find all booking IDs belonging to this client
    const bookings = await Booking.find({ client: req.user._id }).select('_id');
    // Then filter labour requests that match any of those booking IDs
    filter.booking = { $in: bookings.map(b => b._id) };
  } 
  else if (req.user.role === 'labourer') {
    // Labourers see only requests assigned to them
    filter.labourer = req.user._id;
  }
  
  // Populate the booking field with pickup and delivery locations for context
  const requests = await LabourRequest.find(filter).populate('booking', 'pickupLocation deliveryLocation');
  res.json(requests);
});

// Assign a labourer to a pending request (labourer only)
// Simplified: a labourer can "accept" any pending request 
router.put('/:id/assign', protect, authorize('labourer'), async (req, res) => {
  const request = await LabourRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  
  // Only pending requests can be assigned avoids double assignment.
  if (request.status !== 'pending') {
    return res.status(400).json({ message: 'Already assigned or completed' });
  }
  
  // Set the logged-in labourer as the assignee and update status
  request.labourer = req.user._id;
  request.status = 'assigned';
  await request.save();
  res.json({ message: 'Labour request assigned', request });
});

module.exports = router;