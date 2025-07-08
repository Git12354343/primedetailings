// backend/routes/admin.js
const express = require('express');
const { 
  assignBookingToDetailer, 
  getUnassignedBookings, 
  getActiveDetailers,
  autoAssignBooking 
} = require('../controllers/adminController');

const router = express.Router();

// Admin routes (Note: In production, add admin authentication middleware)
router.post('/assign-detailer', assignBookingToDetailer);
router.get('/unassigned-bookings', getUnassignedBookings);
router.get('/active-detailers', getActiveDetailers);
router.post('/auto-assign', autoAssignBooking);

module.exports = router;