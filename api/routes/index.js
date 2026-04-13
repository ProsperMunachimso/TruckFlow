const express = require('express');
const router = express.Router();

// This file is optional – you can mount all routes in app.js directly.
// But the lecturer expects an index.js boilerplate.

router.get('/', (req, res) => {
  res.json({ message: 'API root – use /api/users, /api/bookings, etc.' });
});

module.exports = router;