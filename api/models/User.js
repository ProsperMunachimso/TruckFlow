const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema - stores all user accounts (clients, transporters, and labourers)
const userSchema = new mongoose.Schema({
  // User's full name
  name: { type: String, required: true },
  
  // User's email address which we made required and must be unique across all users
  // Used for login and communication
  email: { type: String, required: true, unique: true },
  
  // Hashed password 
  // The actual password is hashed before saving using bcrypt
  password: { type: String, required: true },
  
  // Contact phone number 
  phone: String,
  
  // Physical address 
  address: String,
  
  // User role determines what actions they can perform in the system
  // Client: books shipments, gets quotes
  // Transporter: provides quotes, handles deliveries
  // Labourer: provides loading/unloading assistance
  role: {
    type: String,
    enum: ['client', 'transporter', 'labourer'],
    required: true
  },
  
  // For transporters - details about their vehicle
  vehicleDetails: {
    truckType: String,      
    capacityKg: Number,     
    licensePlate: String    
  },
  
  // For labourers - details about their work capabilities
  labourerDetails: {
    skills: [String],       // list of skills, we are thinking of removing this
    hourlyRate: Number      // how much they charge per hour
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving to database
// This runs automatically whenever a user is created or password is updated
userSchema.pre('save', async function(next) {
  // Only hash if the password field was modified not on every update
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare a plain text password with the stored hashed password
// Used during login to verify credentials
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);