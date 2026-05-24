// backend/routes/admin.js
const express = require('express');
const {
  assignBookingToDetailer,
  getUnassignedBookings,
  getAllBookings,
  getAssignedBookings,
  getActiveDetailers,
  autoAssignBooking,
  getAllDetailers,
  createDetailer,
  updateDetailer,
  deleteDetailer,
  getRevenueAnalytics,
  adminLogin,
} = require('../controllers/adminController');

// ── Admin auth middleware ──────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  const secret = req.header('X-Admin-Secret') || req.header('Authorization')?.replace('Bearer ', '');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

const router = express.Router();

// ── Public: login (validates secret, returns it back as token) ─────────────────
router.post('/login', adminLogin);

// ── Protected: all routes below require X-Admin-Secret ────────────────────────
router.use(requireAdmin);

// Booking management
router.post('/assign-detailer',    assignBookingToDetailer);
router.get('/unassigned-bookings', getUnassignedBookings);
router.get('/all-bookings',        getAllBookings);
router.get('/assigned-bookings',   getAssignedBookings);
router.get('/active-detailers',    getActiveDetailers);
router.post('/auto-assign',        autoAssignBooking);
router.get('/revenue',             getRevenueAnalytics);

// Detailer account management
router.get('/detailers',           getAllDetailers);
router.post('/detailers',          createDetailer);
router.put('/detailers/:id',       updateDetailer);
router.delete('/detailers/:id',    deleteDetailer);

module.exports = router;
