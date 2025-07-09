// backend/routes/bookings.js
const express = require('express');
const { 
  getAssignedBookings, 
  markBookingCompleted, 
  updateBookingStatus,
  updateBookingNotes,
  debugBooking
} = require('../controllers/bookingController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Get assigned bookings for logged-in detailer (protected)
router.get('/assigned', verifyToken, getAssignedBookings);

// Mark specific booking as completed (protected)
router.patch('/:bookingId/complete', verifyToken, markBookingCompleted);

// Update booking status (protected)
router.patch('/:bookingId/status', verifyToken, updateBookingStatus);

// Update booking notes (protected)
router.patch('/:bookingId/notes', verifyToken, updateBookingNotes);

// Debug endpoint (protected) - for troubleshooting
router.get('/:bookingId/debug', verifyToken, debugBooking);

module.exports = router;