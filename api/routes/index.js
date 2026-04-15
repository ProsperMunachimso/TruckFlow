const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API root – use /api/users, /api/bookings, etc.' });
});

module.exports = router;