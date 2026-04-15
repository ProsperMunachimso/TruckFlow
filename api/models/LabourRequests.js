const mongoose = require('mongoose');
const labourRequestSchema = new mongoose.Schema({
  // LabourRequest schema - tracks when clients need extra help with loading/unloading cargo
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  
  // What kind of assistance is needed: loading, unloading, or both
  // This helps us assign the right labourers
  type: { type: String, enum: ['loading', 'unloading', 'both'], required: true },
  labourer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // How many workers are needed 
  // Clients can request more if the cargo is large or heavy
  numberOfLabourers: { type: Number, default: 1 },
  
  // Estimated hours the labourers will work.
  // We need this information to calculate cost and schedule
  hours: { type: Number, default: 1 },
  
  // Status of the request: pending (no labourer assigned yet), assigned (labourer confirmed), or completed (job done)
  // We track this so we know when to notify the client and when to close the request
  status: { type: String, enum: ['pending', 'assigned', 'completed'], default: 'pending' },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabourRequest', labourRequestSchema);