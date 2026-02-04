// backend/routes/availabilityRoutes.js
const express = require('express');
const {
  getAvailability,
  checkTimeSlot,
  getBlockedDates,
  validateBookingRequest,
  getBusinessConfig
} = require('../controllers/availabilityController');

const router = express.Router();

// Get availability for date range
router.get('/', getAvailability);

// Get business configuration
router.get('/config', getBusinessConfig);

// Check specific time slot availability
router.get('/check', checkTimeSlot);

// Get blocked dates
router.get('/blocked', getBlockedDates);

// Validate booking request before submission
router.post('/validate', validateBookingRequest);

module.exports = router;