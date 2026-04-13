const mongoose = require('mongoose');
const quoteSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  estimatedDurationHours: Number,
  notes: String,
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
});
module.exports = mongoose.model('Quote', quoteSchema);