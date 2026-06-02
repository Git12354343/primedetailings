// backend/routes/bookings.js
const express = require('express');
const {
  getAssignedBookings,
  markBookingCompleted,
  updateBookingStatus,
  updateBookingNotes,
  getBookingByCode,
  createBooking,
  resendConfirmationEmail,
  rescheduleBooking,
  cancelBooking,
} = require('../controllers/bookingController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// PUBLIC ROUTES
router.post('/', createBooking);

// PROTECTED ROUTES — specific paths BEFORE wildcards to prevent shadowing
router.get('/assigned', verifyToken, getAssignedBookings);
router.patch('/:bookingId/complete', verifyToken, markBookingCompleted);
router.patch('/:bookingId/status', verifyToken, updateBookingStatus);
router.patch('/:bookingId/notes', verifyToken, updateBookingNotes);
// debug endpoint removed for production

// Self-serve public management (confirmed by code)
router.post('/:code/resend-email', resendConfirmationEmail);
router.patch('/:code/reschedule', rescheduleBooking);
router.patch('/:code/cancel', cancelBooking);

// Wildcard LAST — must be after all specific routes
router.get('/:code', getBookingByCode);

module.exports = router;