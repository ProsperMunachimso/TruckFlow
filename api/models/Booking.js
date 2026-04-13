const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupLocation: { type: String, required: true },
  deliveryLocation: { type: String, required: true },
  cargoType: String,
  weightKg: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  pickupDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'quoted', 'confirmed', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  selectedQuote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  needLoadingAssistance: { type: Boolean, default: false },
  needUnloadingAssistance: { type: Boolean, default: false },
  specialInstructions: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);