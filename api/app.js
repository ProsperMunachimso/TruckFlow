require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');

const app = express();

// ------------------------- Database Connection -------------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// ------------------------- Middleware ---------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware (required by assignment)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// ------------------------- Routes --------------------------------------
app.use('/api/users', require('./routes/users'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/labour', require('./routes/labour'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/ratings', require('./routes/ratings'));

// Optional: a simple root route to confirm API is running
app.get('/', (req, res) => {
  res.json({ message: 'TruckFlow API is running' });
});

// ------------------------- Start Server -------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));