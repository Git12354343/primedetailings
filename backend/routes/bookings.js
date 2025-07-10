// backend/routes/bookings.js
const express = require('express');
const { 
  getAssignedBookings, 
  markBookingCompleted, 
  updateBookingStatus,
  updateBookingNotes,
  debugBooking,
  getBookingByCode,    // ADD THIS
  createBooking        // ADD THIS
} = require('../controllers/bookingController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// PUBLIC ROUTES (no authentication required)
router.get('/:code', getBookingByCode);    // Get booking by confirmation code
router.post('/', createBooking);           // Create new booking

// PROTECTED ROUTES (authentication required)
router.get('/assigned', verifyToken, getAssignedBookings);
router.patch('/:bookingId/complete', verifyToken, markBookingCompleted);
router.patch('/:bookingId/status', verifyToken, updateBookingStatus);
router.patch('/:bookingId/notes', verifyToken, updateBookingNotes);
router.get('/:bookingId/debug', verifyToken, debugBooking);

module.exports = router;