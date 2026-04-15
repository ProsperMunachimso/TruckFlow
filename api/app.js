require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');

const app = express();


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// Mount API route handlers for different resources
app.use('/api/users', require('./routes/users'));       // Registration, login, profile
app.use('/api/bookings', require('./routes/bookings')); // Create, view, update, delete bookings
app.use('/api/quotes', require('./routes/quotes'));     // Transporters submit quotes, clients accept
app.use('/api/labour', require('./routes/labour'));     // Labour requests for loading/unloading
app.use('/api/invoices', require('./routes/invoices')); // Generate and pay invoices
app.use('/api/ratings', require('./routes/ratings'));   // User ratings after job completion

app.get('/', (req, res) => {
  res.json({ message: 'TruckFlow API is running' });
});


const PORT = process.env.PORT || 9002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));