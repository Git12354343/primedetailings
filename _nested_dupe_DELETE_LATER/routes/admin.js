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


// ── Contact message management ────────────────────────────────────────────────
router.get('/contacts', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, contacts });
  } catch (err) {
    console.error('GET /admin/contacts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
});

router.put('/contacts/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const VALID = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'];
    if (!VALID.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const contact = await prisma.contact.update({ where: { id }, data: { status } });
    res.json({ success: true, contact });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Contact not found' });
    console.error('PUT /admin/contacts/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update contact' });
  }
});

router.delete('/contacts/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const id = parseInt(req.params.id);
    await prisma.contact.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Contact not found' });
    console.error('DELETE /admin/contacts/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
});

module.exports = router;
