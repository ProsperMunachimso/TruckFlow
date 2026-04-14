const mongoose = require('mongoose');

const labourRequestSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  type: { type: String, enum: ['loading', 'unloading', 'both'], required: true },
  labourer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  numberOfLabourers: { type: Number, default: 1 },
  hours: { type: Number, default: 1 },
  status: { type: String, enum: ['pending', 'assigned', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabourRequest', labourRequestSchema);