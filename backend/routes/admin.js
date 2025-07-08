// backend/routes/admin.js (Updated with new routes)
const express = require('express');
const { 
  assignBookingToDetailer, 
  getUnassignedBookings, 
  getAllBookings,        // NEW
  getAssignedBookings,   // NEW
  getActiveDetailers,
  autoAssignBooking 
} = require('../controllers/adminController');

const router = express.Router();

// Admin routes (Note: In production, add admin authentication middleware)
router.post('/assign-detailer', assignBookingToDetailer);
router.get('/unassigned-bookings', getUnassignedBookings);
router.get('/all-bookings', getAllBookings);           // NEW
router.get('/assigned-bookings', getAssignedBookings); // NEW
router.get('/active-detailers', getActiveDetailers);
router.post('/auto-assign', autoAssignBooking);

module.exports = router;