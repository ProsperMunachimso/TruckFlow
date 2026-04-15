const mongoose = require('mongoose');
const quoteSchema = new mongoose.Schema({
  // Quote schema - transporters submit quotes for booking requests
  
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // The price amount quoted for the job
  amount: { type: Number, required: true },
  
  // How many hours the transporter estimates the job will take
  // This helps clients compare quotes and plan schedules
  estimatedDurationHours: Number,
  
  // Any extra details the transporter wants to add (e.g., fuel surcharge, special conditions)
  notes: String,
  
  // Status: pending (waiting for client decision), accepted, or declined
  // We track this so transporters know if they got the job
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quote', quoteSchema);