const mongoose = require('mongoose');

// Define the schema for a Booking document
const bookingSchema = new mongoose.Schema({
  // Reference to the User who made this booking and we used 'ref' to links to the User model, 'required' means every booking must have a client
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Where the cargo should be picked up from
  pickupLocation: { type: String, required: true },
  
  // Where the cargo should be delivered to
  deliveryLocation: { type: String, required: true },
  
  // What type of cargo,
  cargoType: String,
  
  // Weight in kilograms, we decided to make this optional because not everyone may know it.
  weightKg: Number,
  
  // Dimensions object with length, width, height, we also decided to make this optional because not everyone may know it.
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  
  // Date when pickup should happen we made this a required field
  pickupDate: { type: Date, required: true },
  
  // Current status of the booking, with allowed values
  // Default is 'pending' when first created
  status: {
    type: String,
    enum: ['pending', 'quoted', 'confirmed', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Reference to the chosen Quote
  selectedQuote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  
  // Whether the client needs help loading the cargo we set the default to false
  needLoadingAssistance: { type: Boolean, default: false },
  
  // Whether the client needs help unloading the cargo we set the default to false
  needUnloadingAssistance: { type: Boolean, default: false },
  
  // Any extra instructions the client needs to give to the driver or labourers
  specialInstructions: String,
  
  // Automatically set to the current date/time when booking is created, we did this because it is easier than having the user input the date.
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);